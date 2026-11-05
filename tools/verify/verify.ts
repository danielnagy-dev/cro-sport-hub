import { execFile, execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { createWriteStream, existsSync, readFileSync, type WriteStream } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type Page } from '@playwright/test'
import { runEditorFlow, type EditorStep } from './editor-flow.ts'
import {
  apiPaths,
  composeServices,
  ports,
  storyProof,
  targets,
  type RouteCheck,
  type TargetName,
  type TargetSpec,
} from './targets.ts'

type Listener = { pid: number }

type Check = {
  name: string
  url: string
  status: number | null
  ok: boolean
  screenshot: string | null
  consoleErrors: string[]
  pageErrors: string[]
  failedRequests: string[]
  detail?: string
}

type Report = {
  target: TargetName
  gitSha: string
  gitDirty: boolean
  startedAt: string
  durationMs: number
  reused: boolean
  checks: Check[]
}

const USAGE =
  'Usage: vpx tools/verify/verify.ts <api|studio|web|ui|editor|doctor> [api|studio|web|ui] [--route <path>]... [--url <baseUrl>] [--out <dir>] [--timeout <s>]'

class VerifyError extends Error {
  constructor(
    readonly check: string,
    readonly url: string,
    message: string,
  ) {
    super(message)
  }
}

function repoRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '../..')
}

function isTarget(value: string): value is TargetName {
  return value === 'api' || value === 'studio' || value === 'web' || value === 'ui'
}

function parseArgs(argv: readonly string[]): {
  command: TargetName | 'doctor' | 'editor'
  doctorTarget?: TargetName
  routes: string[]
  url?: string
  out?: string
  timeoutSeconds?: number
} {
  const [command, ...rest] = argv
  if (
    command === undefined ||
    (command !== 'doctor' && command !== 'editor' && !isTarget(command))
  ) {
    throw new Error(USAGE)
  }
  const options: {
    command: TargetName | 'doctor' | 'editor'
    doctorTarget?: TargetName
    routes: string[]
    url?: string
    out?: string
    timeoutSeconds?: number
  } = { command, routes: [] }
  let index = 0
  if (command === 'doctor' && rest[0] !== undefined && isTarget(rest[0])) {
    options.doctorTarget = rest[0]
    index = 1
  }
  for (; index < rest.length; index += 1) {
    const flag = rest[index]
    const value = rest[index + 1]
    if (value === undefined) throw new Error(USAGE)
    if (flag === '--route') options.routes.push(value)
    else if (flag === '--url') options.url = value
    else if (flag === '--out') options.out = value
    else if (flag === '--timeout') {
      if (!/^[1-9]\d*$/.test(value))
        throw new Error('--timeout must be a positive number of seconds')
      options.timeoutSeconds = Number(value)
    } else throw new Error(USAGE)
    index += 1
  }
  return options
}

function stamp(date: Date): string {
  const pad = (value: number, width = 2) => String(value).padStart(width, '0')
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}${pad(date.getUTCMilliseconds(), 3)}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms)
  })
}

function capture(
  command: string,
  args: readonly string[],
  cwd: string,
): { ok: true; stdout: string } | { ok: false; message: string } {
  try {
    return {
      ok: true,
      stdout: execFileSync(command, [...args], {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    }
  } catch (error) {
    const stderr =
      error instanceof Error && 'stderr' in error && typeof error.stderr === 'string'
        ? error.stderr.trim()
        : ''
    return {
      ok: false,
      message: stderr !== '' ? stderr : error instanceof Error ? error.message : 'command failed',
    }
  }
}

function run(command: string, args: readonly string[], cwd: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    execFile(command, [...args], { cwd, encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        const text = typeof stderr === 'string' ? stderr.trim() : ''
        reject(new Error(text !== '' ? text : error.message))
        return
      }
      resolvePromise(stdout)
    })
  })
}

/** `true` when this family is absent. `false` when the port is taken. */
function addressFree(host: string, port: number): Promise<boolean> {
  return new Promise((resolvePromise, reject) => {
    const server = createServer()
    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') resolvePromise(false)
      else if (error.code === 'EAFNOSUPPORT' || error.code === 'EADDRNOTAVAIL') resolvePromise(true)
      else reject(error)
    })
    server.listen(
      host === '::'
        ? { host, port, exclusive: true, ipv6Only: true }
        : { host, port, exclusive: true },
      () => {
        server.close(() => resolvePromise(true))
      },
    )
  })
}

async function portInUse(port: number): Promise<boolean> {
  if (!(await addressFree('::', port))) return true
  return !(await addressFree('0.0.0.0', port))
}

function lsofPids(port: number): Listener[] {
  const result = capture('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp'], repoRoot())
  if (!result.ok) return []
  const listeners: Listener[] = []
  for (const line of result.stdout.split('\n')) {
    const pid = /^p(\d+)$/.exec(line.trim())?.[1]
    if (pid === undefined) continue
    listeners.push({ pid: Number(pid) })
  }
  return listeners
}

/** `undefined` when the port is free. An empty list means it is busy but unnamed. */
async function portHolders(port: number): Promise<Listener[] | undefined> {
  if (!(await portInUse(port))) return undefined
  return lsofPids(port)
}

function busyMessage(port: number, holders: readonly Listener[]): string {
  const who =
    holders.length === 0
      ? 'an unnamed process'
      : holders.map((holder) => `pid ${holder.pid}`).join(', ')
  return `Port ${port} is in use by ${who}`
}

function chromiumStatus(): { ok: boolean; detail: string } {
  try {
    const executable = chromium.executablePath()
    if (!existsSync(executable)) {
      return {
        ok: false,
        detail: `Playwright Chromium is not installed (${executable}). Run: vp exec playwright install chromium`,
      }
    }
    return { ok: true, detail: executable }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Playwright Chromium is not installed'
    return { ok: false, detail: `${message}. Run: vp exec playwright install chromium` }
  }
}

async function doctor(root: string, target?: TargetName): Promise<number> {
  const problems: string[] = []
  const pinned = readFileSync(join(root, '.node-version'), 'utf8').trim()
  const pinnedMajor = pinned.split('.')[0] ?? ''
  const running = process.versions.node ?? ''
  if (running.split('.')[0] !== pinnedMajor) {
    problems.push(`Node is ${running}; .node-version is ${pinned}.`)
  } else {
    console.log(`ok  node ${running} (pinned ${pinned})`)
  }
  const checked = target === undefined ? Object.values(ports) : [ports[target]]
  for (const port of checked) {
    const holders = await portHolders(port)
    if (holders === undefined) console.log(`ok  port ${port} is free`)
    else problems.push(`${busyMessage(port, holders)}. Doctor does not kill processes.`)
  }
  const browser = chromiumStatus()
  if (browser.ok) console.log(`ok  playwright chromium ${browser.detail}`)
  else problems.push(browser.detail)
  const version = capture('docker', ['compose', 'version'], root)
  const daemon = version.ok ? capture('docker', ['compose', 'ps', '--services'], root) : undefined
  if (version.ok && daemon?.ok === true) console.log(`ok  ${version.stdout.trim()}`)
  else {
    const message = version.ok
      ? `Docker is not running (${daemon?.ok === false ? daemon.message : 'docker compose ps failed'}). verify:api needs postgres and redis.`
      : `Docker Compose is not available (${version.message}). verify:api needs postgres and redis.`
    if (target === 'api') problems.push(message)
    else console.log(`warn  ${message}`)
  }
  if (problems.length === 0) {
    console.log('doctor: ok')
    return 0
  }
  console.log('doctor: problems')
  for (const problem of problems) console.log(`- ${problem}`)
  return 1
}

function joinUrl(base: string, route: string): string {
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base
  return `${trimmed}${route.startsWith('/') ? route : `/${route}`}`
}

function sameOrigin(resource: string, base: string): boolean {
  try {
    const left = new URL(resource)
    const right = new URL(base)
    const host = (value: string) => (value === 'localhost' ? '127.0.0.1' : value)
    return (
      left.protocol === right.protocol &&
      host(left.hostname) === host(right.hostname) &&
      left.port === right.port
    )
  } catch {
    return false
  }
}

function composeValue(text: string, key: string): string {
  const match = new RegExp(`^[ \\t]*${key}:[ \\t]*["']?([^"'#\\s]+)["']?[ \\t]*$`, 'm').exec(text)
  const value = match?.[1]
  if (value === undefined || value === '') {
    throw new VerifyError(
      'docker',
      'docker-compose.yml',
      `${key} is missing from docker-compose.yml`,
    )
  }
  return value
}

function childEnv(root: string, target: TargetName): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }
  if (target === 'studio') env.NG_CLI_ANALYTICS = 'false'
  if (target === 'web') env.NEXT_TELEMETRY_DISABLED = '1'
  if (target !== 'api') return env
  env.PORT = String(ports.api)
  if (existsSync(join(root, '.env'))) return env
  const compose = readFileSync(join(root, 'docker-compose.yml'), 'utf8')
  const user = encodeURIComponent(composeValue(compose, 'POSTGRES_USER'))
  const password = encodeURIComponent(composeValue(compose, 'POSTGRES_PASSWORD'))
  const database = encodeURIComponent(composeValue(compose, 'POSTGRES_DB'))
  env.DATABASE_URL = `postgresql://${user}:${password}@127.0.0.1:5432/${database}`
  env.REDIS_URL = 'redis://127.0.0.1:6379'
  return env
}

function resolveVp(root: string): string {
  const local = join(root, 'node_modules', '.bin', 'vp')
  return existsSync(local) ? local : 'vp'
}

async function waitReady(url: string, timeoutMs: number, signal?: AbortSignal): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let last = 'no response'
  let unavailable = 0
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error('aborted')
    try {
      const response = await fetch(url, {
        signal:
          signal === undefined
            ? AbortSignal.timeout(5_000)
            : AbortSignal.any([AbortSignal.timeout(5_000), signal]),
      })
      if (response.status < 500) return
      last = `HTTP ${response.status}`
      if (response.status === 503) {
        unavailable += 1
        if (unavailable >= 3) {
          throw new VerifyError(
            'readiness',
            url,
            `${url} returned HTTP 503 three times. Postgres or Redis is unreachable, or DATABASE_URL does not match Compose.`,
          )
        }
      }
    } catch (error) {
      if (error instanceof VerifyError) throw error
      if (signal?.aborted) throw new Error('aborted')
      last = error instanceof Error ? error.message : 'request failed'
    }
    await sleep(500)
  }
  if (signal?.aborted) throw new Error('aborted')
  throw new VerifyError(
    'readiness',
    url,
    `Readiness timed out after ${timeoutMs / 1000}s (${last}).`,
  )
}

function signalGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal)
  } catch {
    try {
      process.kill(pid, signal)
    } catch {
      // The process is already gone.
    }
  }
}

function groupAlive(pid: number): boolean {
  try {
    process.kill(-pid, 0)
    return true
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined
    return code === 'EPERM'
  }
}

async function killProcessGroup(pid: number): Promise<void> {
  signalGroup(pid, 'SIGTERM')
  const deadline = Date.now() + 10_000
  while (groupAlive(pid) && Date.now() < deadline) await sleep(200)
  if (!groupAlive(pid)) return
  signalGroup(pid, 'SIGKILL')
  const killed = Date.now() + 2_000
  while (groupAlive(pid) && Date.now() < killed) await sleep(200)
}

const logEnders = new WeakMap<WriteStream, Promise<void>>()

function endLog(stream: WriteStream | undefined): Promise<void> {
  if (stream === undefined) return Promise.resolve()
  const existing = logEnders.get(stream)
  if (existing !== undefined) return existing
  const pending = stream.writableEnded
    ? Promise.resolve()
    : new Promise<void>((resolvePromise) => {
        stream.end(() => resolvePromise())
      })
  logEnders.set(stream, pending)
  return pending
}

function logTail(path: string): string {
  try {
    return readFileSync(path, 'utf8').trim().split('\n').slice(-20).join('\n')
  } catch {
    return ''
  }
}

async function waitUntilReady(
  url: string,
  timeoutMs: number,
  server: ChildProcess | undefined,
  logPath: string,
  log: WriteStream | undefined,
): Promise<void> {
  if (server === undefined) {
    await waitReady(url, timeoutMs)
    return
  }
  const abort = new AbortController()
  const ready = waitReady(url, timeoutMs, abort.signal)
  let onExit = (): void => undefined
  const exited = new Promise<never>((_resolve, reject) => {
    onExit = () => reject(new Error('exited'))
    if (server.exitCode !== null || server.signalCode !== null) onExit()
    else server.once('exit', onExit)
  })
  try {
    await Promise.race([ready, exited])
  } catch (error) {
    abort.abort()
    server.off('exit', onExit)
    void ready.catch(() => undefined)
    if (error instanceof VerifyError) throw error
    await new Promise<void>((resolvePromise) => {
      const timer = setTimeout(resolvePromise, 200)
      server.once('close', () => {
        clearTimeout(timer)
        resolvePromise()
      })
    })
    await endLog(log)
    const tail = logTail(logPath)
    const code = server.exitCode ?? server.signalCode ?? 'unknown'
    throw new VerifyError(
      'server',
      url,
      `Dev server exited (${String(code)}) before it was ready.${tail === '' ? '' : `\n${tail}`}`,
    )
  }
  server.off('exit', onExit)
}

function gitMeta(root: string): { gitSha: string; gitDirty: boolean } {
  const sha = capture('git', ['rev-parse', 'HEAD'], root)
  const dirty = capture('git', ['status', '--porcelain'], root)
  return {
    gitSha: sha.ok ? sha.stdout.trim() : 'unknown',
    gitDirty: !dirty.ok || dirty.stdout.trim() !== '',
  }
}

function parseJson(text: string): unknown {
  const value: unknown = JSON.parse(text)
  return value
}

function assertOpenApi(body: unknown): void {
  if (typeof body !== 'object' || body === null || !('openapi' in body)) {
    throw new Error('OpenAPI JSON has no top-level openapi field')
  }
  if (typeof body.openapi !== 'string' || body.openapi === '') {
    throw new Error('OpenAPI JSON openapi field is not a string')
  }
}

async function checkGet(
  name: string,
  url: string,
  file: string,
  assertBody?: (body: unknown) => void,
): Promise<Check> {
  let status: number | null = null
  let detail: string | undefined
  try {
    const response = await fetch(url)
    status = response.status
    const text = await response.text()
    await writeFile(file, text)
    if (status !== 200) detail = `HTTP ${status}`
    else if (assertBody !== undefined) assertBody(parseJson(text))
  } catch (error) {
    detail = error instanceof Error ? error.message : 'request failed'
  }
  return {
    name,
    url,
    status,
    ok: detail === undefined && status === 200,
    screenshot: null,
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    detail,
  }
}

function watchPage(
  page: Page,
  base: string,
): { consoleErrors: string[]; pageErrors: string[]; failedRequests: string[] } {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })
  page.on('requestfailed', (request) => {
    if (!sameOrigin(request.url(), base) || request.resourceType() === 'websocket') return
    const reason = request.failure()?.errorText ?? 'failed'
    if (reason === 'net::ERR_ABORTED') return
    failedRequests.push(`${request.method()} ${request.url()} ${reason}`)
  })
  page.on('response', (response) => {
    if (!sameOrigin(response.url(), base) || response.status() < 400) return
    if (response.request().resourceType() === 'websocket') return
    failedRequests.push(
      `${response.request().method()} ${response.url()} HTTP ${response.status()}`,
    )
  })
  return { consoleErrors, pageErrors, failedRequests }
}

async function expectHandle(page: Page, route: RouteCheck): Promise<void> {
  if (route.handle.kind === 'storybook') {
    await page.waitForFunction(
      "(() => { const root = document.querySelector('#storybook-root'); return root !== null && (root.textContent ?? '').trim() !== ''; })()",
      undefined,
      { timeout: 15_000 },
    )
    return
  }
  const landmark =
    route.handle.kind === 'text'
      ? page.getByText(route.handle.name, { exact: false }).first()
      : route.handle.kind === 'heading'
        ? page.getByRole('heading', { name: route.handle.name })
        : page.getByRole('main')
  await landmark.waitFor({ state: 'visible', timeout: 15_000 })
  if (route.proof === undefined) return
  const scope = route.handle.kind === 'main' ? page.getByRole('main') : page.locator('body')
  // `listitem` has no accessible name in Chromium, so match the text inside the role.
  const located =
    route.proofRole === undefined
      ? scope.getByText(route.proof, { exact: false })
      : scope.getByRole(route.proofRole).filter({ hasText: route.proof })
  await located.first().waitFor({ state: 'visible', timeout: 15_000 })
}

async function checkPage(
  browser: Browser,
  base: string,
  route: RouteCheck,
  outDir: string,
  index: number,
): Promise<Check> {
  const url = joinUrl(base, route.path)
  const slug =
    route.path === '/'
      ? 'root'
      : route.path
          .replace(/[^a-z0-9]+/gi, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 60)
  const file = `${String(index + 1).padStart(2, '0')}-${slug === '' ? 'route' : slug}.png`
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const logs = watchPage(page, base)
  let status: number | null = null
  let detail: string | undefined
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
    status = response?.status() ?? null
    await expectHandle(page, route)
  } catch (error) {
    detail = error instanceof Error ? error.message : 'page check failed'
  }
  let screenshot: string | null = null
  try {
    await page.screenshot({ path: join(outDir, file), fullPage: true })
    screenshot = file
  } catch (error) {
    detail ??= error instanceof Error ? error.message : 'screenshot failed'
  }
  await page.close()
  const httpOk = status !== null && status < 400
  const clean =
    logs.consoleErrors.length === 0 &&
    logs.pageErrors.length === 0 &&
    logs.failedRequests.length === 0
  return {
    name: route.name,
    url,
    status,
    ok: detail === undefined && httpOk && clean,
    screenshot,
    ...logs,
    detail,
  }
}

type Story = { id: string; title: string; name: string }

function failedCheck(name: string, url: string, detail: string): Check {
  return {
    name,
    url,
    status: null,
    ok: false,
    screenshot: null,
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    detail,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function storiesFromIndex(body: unknown): Story[] {
  if (!isRecord(body)) throw new Error('Storybook index.json has no entries object')
  const entries = body.entries
  const values = Array.isArray(entries) ? entries : isRecord(entries) ? Object.values(entries) : []
  const stories: Story[] = []
  for (const value of values) {
    if (!isRecord(value) || value.type !== 'story' || typeof value.id !== 'string') continue
    const title = typeof value.title === 'string' ? value.title : value.id
    const name = typeof value.name === 'string' ? value.name : value.id
    stories.push({ id: value.id, title, name })
  }
  return stories.slice(0, 10)
}

function resultLabel(check: Check): string {
  if (check.ok) return 'pass'
  const reason =
    check.detail ??
    (check.status !== null && check.status >= 400 ? `HTTP ${check.status}` : undefined) ??
    check.consoleErrors[0] ??
    check.pageErrors[0] ??
    check.failedRequests[0] ??
    'failed'
  return `fail: ${reason.replaceAll('\n', ' ').slice(0, 180)}`
}

function writeSummary(report: Report, outDir: string): Promise<void> {
  const lines = [
    `# verify ${report.target}`,
    '',
    `- git: ${report.gitSha}${report.gitDirty ? ' (dirty)' : ' (clean)'}`,
    `- reused: ${report.reused}`,
    `- result: ${report.checks.every((check) => check.ok) ? 'pass' : 'fail'}`,
    '',
    '| Check | URL | Result | Screenshot |',
    '|---|---|---|---|',
    ...report.checks.map(
      (check) =>
        `| ${check.name} | ${check.url} | ${resultLabel(check)} | ${check.screenshot ?? ''} |`,
    ),
    '',
  ]
  return writeFile(join(outDir, 'summary.md'), lines.join('\n'))
}

async function missingComposeServices(root: string): Promise<string[]> {
  let stdout: string
  try {
    stdout = await run('docker', ['compose', 'ps', '--status', 'running', '--services'], root)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'docker compose ps failed'
    throw new VerifyError(
      'docker',
      'docker-compose.yml',
      `Docker Compose is not available (${message}). Start nothing else; fix Docker and rerun.`,
    )
  }
  const running = new Set(
    stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== ''),
  )
  return composeServices.filter((service) => !running.has(service))
}

async function startCompose(root: string, services: readonly string[]): Promise<void> {
  try {
    await run('docker', ['compose', 'up', '-d', '--wait', ...services], root)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'docker compose up failed'
    throw new VerifyError(
      'docker',
      'docker-compose.yml',
      `Could not start ${services.join(', ')} (${message}).`,
    )
  }
}

const EDITOR_STACK: readonly TargetName[] = ['api', 'studio', 'web']

function requireEditorEnv(): { editor: string; admin: string } {
  const secret = process.env.JWT_SECRET?.trim() ?? ''
  if (secret.length < 32) {
    throw new VerifyError(
      'env',
      'process.env',
      'JWT_SECRET must be at least 32 characters in the environment.',
    )
  }
  const editor = process.env.EDITOR_DEMO_PASSWORD ?? ''
  const admin = process.env.ADMIN_DEMO_PASSWORD ?? ''
  if (editor.length < 8 || editor.length > 72 || admin.length < 8 || admin.length > 72) {
    throw new VerifyError(
      'env',
      'process.env',
      'EDITOR_DEMO_PASSWORD and ADMIN_DEMO_PASSWORD must be 8 to 72 characters in the environment.',
    )
  }
  return { editor, admin }
}

async function seedCatalog(root: string): Promise<void> {
  const vp = resolveVp(root)
  await new Promise<void>((resolvePromise, reject) => {
    execFile(
      vp,
      ['run', 'api#seed'],
      { cwd: root, env: childEnv(root, 'api'), encoding: 'utf8' },
      (error, _stdout, stderr) => {
        if (error) {
          const text = typeof stderr === 'string' ? stderr.trim() : ''
          reject(new Error(text !== '' ? text : error.message))
          return
        }
        resolvePromise()
      },
    )
  })
}

function editorStepLabel(step: EditorStep): string {
  if (step.ok) return 'pass'
  const reason = step.detail ?? 'failed'
  return `fail: ${reason.replaceAll('\n', ' ').slice(0, 180)}`
}

function writeEditorSummary(
  report: {
    gitSha: string
    gitDirty: boolean
    reused: boolean
    checks: EditorStep[]
  },
  outDir: string,
): Promise<void> {
  const lines = [
    '# verify editor',
    '',
    `- git: ${report.gitSha}${report.gitDirty ? ' (dirty)' : ' (clean)'}`,
    `- reused: ${report.reused}`,
    `- result: ${report.checks.every((check) => check.ok) ? 'pass' : 'fail'}`,
    '',
    '| Step | URL | Result | Screenshot |',
    '|---|---|---|---|',
    ...report.checks.map(
      (check) =>
        `| ${check.name} | ${check.url} | ${editorStepLabel(check)} | ${check.screenshot ?? ''} |`,
    ),
    '',
  ]
  return writeFile(join(outDir, 'summary.md'), lines.join('\n'))
}

async function runEditorVerify(
  root: string,
  outDir: string,
  timeoutSeconds?: number,
): Promise<number> {
  const passwords = requireEditorEnv()
  const startedAt = new Date()
  const logPath = join(outDir, 'server.log')
  const logStream = createWriteStream(logPath)
  const stop = new AbortController()
  const checks: EditorStep[] = []
  const children: ChildProcess[] = []
  let startedServices: string[] = []

  const cleanup = async (): Promise<void> => {
    stop.abort()
    for (const child of children) {
      if (child.pid !== undefined) await killProcessGroup(child.pid)
    }
    await endLog(logStream)
    if (startedServices.length > 0) {
      try {
        await run('docker', ['compose', 'stop', ...startedServices], root)
      } catch {
        // Teardown best effort.
      }
    }
  }

  try {
    const missing = await missingComposeServices(root)
    if (missing.length > 0) {
      startedServices = [...missing]
      await startCompose(root, missing)
    }
    await seedCatalog(root)

    for (const name of EDITOR_STACK) {
      const spec = targets[name]
      const holders = await portHolders(spec.port)
      if (holders !== undefined) {
        throw new VerifyError(
          'port',
          `http://localhost:${spec.port}`,
          `${busyMessage(spec.port, holders)}. Refusing to start a second server.`,
        )
      }
      const vp = resolveVp(root)
      const server = spawn(vp, spec.command.slice(1), {
        cwd: root,
        env: childEnv(root, spec.name),
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      children.push(server)
      logStream.write(`$ vp ${spec.command.slice(1).join(' ')}\n`)
      server.stdout?.pipe(logStream, { end: false })
      server.stderr?.pipe(logStream, { end: false })
      await new Promise<void>((resolvePromise, reject) => {
        server.once('spawn', () => resolvePromise())
        server.once('error', reject)
      })
      const base = `http://localhost:${spec.port}`
      await waitUntilReady(
        joinUrl(base, spec.readinessPath),
        (timeoutSeconds ?? spec.timeoutSeconds) * 1000,
        server,
        logPath,
        logStream,
      )
    }

    const browserStatus = chromiumStatus()
    if (!browserStatus.ok) throw new VerifyError('browser', 'playwright', browserStatus.detail)
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
      checks.push(
        ...(await runEditorFlow(
          page,
          { studio: `http://localhost:${ports.studio}`, web: `http://localhost:${ports.web}` },
          passwords,
          outDir,
          { value: 0 },
        )),
      )
      await page.close()
    } finally {
      await browser.close()
    }
  } catch (error) {
    if (!stop.signal.aborted) {
      const message = error instanceof Error ? error.message : 'verify:editor failed'
      checks.push({
        name: 'verify:editor',
        url: `http://localhost:${ports.studio}`,
        ok: false,
        detail: message,
        screenshot: null,
      })
    }
  } finally {
    await cleanup()
  }

  const git = gitMeta(root)
  const report = {
    target: 'editor' as const,
    gitSha: git.gitSha,
    gitDirty: git.gitDirty,
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    reused: false,
    checks,
  }
  await writeFile(join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  await writeEditorSummary(report, outDir)
  console.log(readFileSync(join(outDir, 'summary.md'), 'utf8'))
  return checks.every((check) => check.ok) ? 0 : 1
}

async function drive(
  spec: TargetSpec,
  base: string,
  routes: readonly string[],
  outDir: string,
): Promise<Check[]> {
  const browserStatus = chromiumStatus()
  if (!browserStatus.ok) throw new VerifyError('browser', base, browserStatus.detail)
  const browser = await chromium.launch({ headless: true })
  const checks: Check[] = []
  try {
    if (spec.name === 'api') {
      checks.push(
        await checkGet('GET /health', joinUrl(base, apiPaths.health), join(outDir, 'health.json')),
      )
      checks.push(
        await checkGet(
          'GET /docs-json',
          joinUrl(base, apiPaths.openApi),
          join(outDir, 'openapi.json'),
          assertOpenApi,
        ),
      )
    }
    let index = 0
    const pages: RouteCheck[] = spec.name === 'ui' ? [] : [...spec.routes]
    if (spec.name === 'ui') {
      const indexUrl = joinUrl(base, '/index.json')
      const indexCheck = await checkGet('GET /index.json', indexUrl, join(outDir, 'index.json'))
      checks.push(indexCheck)
      if (indexCheck.ok) {
        try {
          const stories = storiesFromIndex(
            parseJson(readFileSync(join(outDir, 'index.json'), 'utf8')),
          )
          if (stories.length === 0) {
            checks.push(failedCheck('stories', indexUrl, 'index.json listed no stories'))
          }
          for (const story of stories) {
            const known = storyProof[story.id]
            pages.push({
              name: `${story.title}/${story.name}`,
              path: `/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`,
              handle: known === undefined ? { kind: 'storybook' } : { kind: 'text', name: known },
            })
          }
        } catch (error) {
          checks.push(
            failedCheck(
              'stories',
              indexUrl,
              error instanceof Error ? error.message : 'Could not read index.json',
            ),
          )
        }
      }
    }
    if (spec.name === 'api') {
      for (const route of routes) {
        const slug = route
          .replace(/[^a-z0-9]+/gi, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 60)
        checks.push(
          await checkGet(
            `GET ${route}`,
            joinUrl(base, route),
            join(outDir, `${slug === '' ? 'route' : slug}.json`),
          ),
        )
      }
    } else {
      for (const route of routes) pages.push({ name: route, path: route, handle: { kind: 'main' } })
    }
    for (const route of pages) {
      checks.push(await checkPage(browser, base, route, outDir, index))
      index += 1
    }
  } finally {
    await browser.close()
  }
  return checks
}

async function main(): Promise<number> {
  const options = parseArgs(process.argv.slice(2))
  const root = repoRoot()
  if (options.command === 'doctor') return doctor(root, options.doctorTarget)
  if (options.command === 'editor') {
    const startedAt = new Date()
    const outDir =
      options.out === undefined
        ? join(root, 'artifacts', 'verify', 'editor', stamp(startedAt))
        : resolve(root, options.out)
    await mkdir(outDir, { recursive: true })
    return runEditorVerify(root, outDir, options.timeoutSeconds)
  }

  const spec = targets[options.command]
  const startedAt = new Date()
  const outDir =
    options.out === undefined
      ? join(root, 'artifacts', 'verify', spec.name, stamp(startedAt))
      : resolve(root, options.out)
  await mkdir(outDir, { recursive: true })
  const reused = options.url !== undefined
  // Dev servers advertise localhost. Next.js 16 blocks dev resources (including
  // HMR) requested from 127.0.0.1 while the page origin is localhost.
  const base = options.url ?? `http://localhost:${spec.port}`
  let child: ChildProcess | undefined
  let logStream: WriteStream | undefined
  let startedServices: string[] = []
  const checks: Check[] = []
  const logPath = join(outDir, 'server.log')
  const stop = new AbortController()
  let interrupted: number | undefined
  let cleanupPromise: Promise<string | undefined> | undefined
  let finishPromise: Promise<void> | undefined

  const cleanup = (): Promise<string | undefined> => {
    cleanupPromise ??= (async () => {
      stop.abort()
      const problems: string[] = []
      if (child?.pid !== undefined) {
        await killProcessGroup(child.pid)
        await endLog(logStream)
        const holders = await portHolders(spec.port)
        if (holders !== undefined)
          problems.push(`${busyMessage(spec.port, holders)} after teardown`)
      }
      if (startedServices.length > 0) {
        try {
          await run('docker', ['compose', 'stop', ...startedServices], root)
        } catch (error) {
          problems.push(error instanceof Error ? error.message : 'docker compose stop failed')
        }
      }
      const detail = problems.length === 0 ? undefined : problems.join(' ')
      if (detail !== undefined) console.error(detail)
      return detail
    })()
    return cleanupPromise
  }

  const recordTeardown = (detail: string | undefined): void => {
    if (checks.some((check) => check.name === 'teardown')) return
    checks.push(
      detail === undefined
        ? { ...failedCheck('teardown', base, ''), ok: true, detail: undefined }
        : failedCheck('teardown', base, detail),
    )
  }

  const writeReport = async (): Promise<void> => {
    const git = gitMeta(root)
    const report: Report = {
      target: spec.name,
      gitSha: git.gitSha,
      gitDirty: git.gitDirty,
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      reused,
      checks,
    }
    await writeFile(join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
    await writeSummary(report, outDir)
  }

  const finish = (exitCode?: number): Promise<void> => {
    if (exitCode !== undefined) interrupted = exitCode
    finishPromise ??= (async () => {
      const detail = await cleanup()
      recordTeardown(detail)
      if (interrupted !== undefined && !checks.some((check) => check.name === 'interrupted')) {
        checks.push(failedCheck('interrupted', base, `Stopped by signal (exit ${interrupted}).`))
      }
      await writeReport()
    })().catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : 'could not write the report')
    })
    return finishPromise.then(() => {
      if (exitCode !== undefined) process.exit(exitCode)
    })
  }

  process.on('SIGINT', () => {
    void finish(130)
  })
  process.on('SIGTERM', () => {
    void finish(143)
  })

  try {
    if (!reused) {
      const holders = await portHolders(spec.port)
      if (holders !== undefined) {
        throw new VerifyError(
          'port',
          base,
          `${busyMessage(spec.port, holders)}. Refusing to start a second server.`,
        )
      }
      if (spec.name === 'api') {
        const missing = await missingComposeServices(root)
        if (missing.length > 0) {
          startedServices = missing
          await startCompose(root, missing)
        }
      }
      const vp = resolveVp(root)
      const server = spawn(vp, spec.command.slice(1), {
        cwd: root,
        env: childEnv(root, spec.name),
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      child = server
      logStream = createWriteStream(logPath)
      logStream.write(`$ vp ${spec.command.slice(1).join(' ')}\n`)
      server.stdout?.pipe(logStream, { end: false })
      server.stderr?.pipe(logStream, { end: false })
      await new Promise<void>((resolvePromise, reject) => {
        server.once('spawn', () => resolvePromise())
        server.once('error', reject)
      })
      await waitUntilReady(
        joinUrl(base, spec.readinessPath),
        (options.timeoutSeconds ?? spec.timeoutSeconds) * 1000,
        server,
        logPath,
        logStream,
      )
    } else {
      await waitUntilReady(
        joinUrl(base, spec.readinessPath),
        (options.timeoutSeconds ?? spec.timeoutSeconds) * 1000,
        undefined,
        logPath,
        undefined,
      )
    }
    checks.push(...(await drive(spec, base, options.routes, outDir)))
  } catch (error) {
    // Ctrl-C starts cleanup, which kills the child. That exit is not a server crash.
    if (!stop.signal.aborted) {
      const failed =
        error instanceof VerifyError
          ? error
          : new VerifyError(
              'verify',
              base,
              error instanceof Error ? error.message : 'verify failed',
            )
      checks.push(failedCheck(failed.check, failed.url, failed.message))
    }
  }

  await finish()
  console.log(readFileSync(join(outDir, 'summary.md'), 'utf8'))
  return checks.every((check) => check.ok) ? 0 : 1
}

try {
  process.exitCode = await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : 'verify failed')
  process.exitCode = 1
}
