import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { createWriteStream, existsSync, readFileSync, type WriteStream } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { ports, targets } from './targets.ts'
import { runVisitorFlow, type VisitorStep } from './visitor-flow.ts'

class VerifyError extends Error {
  constructor(
    readonly check: string,
    readonly url: string,
    message: string,
  ) {
    super(message)
  }
}

type Report = {
  target: 'visitor'
  gitSha: string
  gitDirty: boolean
  startedAt: string
  durationMs: number
  reused: boolean
  checks: VisitorStep[]
}

function repoRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '../..')
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

function joinUrl(base: string, route: string): string {
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base
  return `${trimmed}${route.startsWith('/') ? route : `/${route}`}`
}

function resolveVp(root: string): string {
  const local = join(root, 'node_modules', '.bin', 'vp')
  return existsSync(local) ? local : 'vp'
}

function childEnv(): NodeJS.ProcessEnv {
  return { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
}

async function waitReady(url: string, timeoutMs: number, signal?: AbortSignal): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let last = 'no response'
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
    } catch (error) {
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

function gitMeta(root: string): { gitSha: string; gitDirty: boolean } {
  const sha = capture('git', ['rev-parse', 'HEAD'], root)
  const dirty = capture('git', ['status', '--porcelain'], root)
  return {
    gitSha: sha.ok ? sha.stdout.trim() : 'unknown',
    gitDirty: !dirty.ok || dirty.stdout.trim() !== '',
  }
}

function resultLabel(step: VisitorStep): string {
  if (step.ok) return 'pass'
  const reason = step.detail ?? 'failed'
  return `fail: ${reason.replaceAll('\n', ' ').slice(0, 180)}`
}

function writeSummary(report: Report, outDir: string): Promise<void> {
  const lines = [
    '# verify visitor',
    '',
    `- git: ${report.gitSha}${report.gitDirty ? ' (dirty)' : ' (clean)'}`,
    `- reused: ${report.reused}`,
    `- result: ${report.checks.every((check) => check.ok) ? 'pass' : 'fail'}`,
    '',
    '| Step | URL | Result | Screenshot |',
    '|---|---|---|---|',
    ...report.checks.map(
      (check) =>
        `| ${check.name} | ${check.url} | ${resultLabel(check)} | ${check.screenshot ?? ''} |`,
    ),
    '',
  ]
  return writeFile(join(outDir, 'summary.md'), lines.join('\n'))
}

function parseArgs(argv: readonly string[]): {
  url?: string
  out?: string
  timeoutSeconds?: number
} {
  const options: { url?: string; out?: string; timeoutSeconds?: number } = {}
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (value === undefined)
      throw new Error(
        'Usage: vpx tools/verify/visitor.ts [--url <baseUrl>] [--out <dir>] [--timeout <s>]',
      )
    if (flag === '--url') options.url = value
    else if (flag === '--out') options.out = value
    else if (flag === '--timeout') {
      if (!/^[1-9]\d*$/.test(value))
        throw new Error('--timeout must be a positive number of seconds')
      options.timeoutSeconds = Number(value)
    } else
      throw new Error(
        'Usage: vpx tools/verify/visitor.ts [--url <baseUrl>] [--out <dir>] [--timeout <s>]',
      )
    index += 1
  }
  return options
}

async function main(): Promise<number> {
  const options = parseArgs(process.argv.slice(2))
  const root = repoRoot()
  const web = targets.web
  const startedAt = new Date()
  const outDir =
    options.out === undefined
      ? join(root, 'artifacts', 'verify', 'visitor', stamp(startedAt))
      : resolve(root, options.out)
  await mkdir(outDir, { recursive: true })
  const reused = options.url !== undefined
  const base = options.url ?? `http://localhost:${ports.web}`
  let child: ChildProcess | undefined
  let logStream: WriteStream | undefined
  const checks: VisitorStep[] = []
  const logPath = join(outDir, 'server.log')
  const stop = new AbortController()

  const cleanup = async (): Promise<string | undefined> => {
    stop.abort()
    if (child?.pid === undefined) return undefined
    await killProcessGroup(child.pid)
    if (logStream !== undefined && !logStream.writableEnded) {
      await new Promise<void>((resolvePromise) => {
        logStream?.end(() => resolvePromise())
      })
    }
    return undefined
  }

  try {
    if (!reused) {
      const vp = resolveVp(root)
      const server = spawn(vp, web.command.slice(1), {
        cwd: root,
        env: childEnv(),
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      child = server
      logStream = createWriteStream(logPath)
      logStream.write(`$ vp ${web.command.slice(1).join(' ')}\n`)
      server.stdout?.pipe(logStream, { end: false })
      server.stderr?.pipe(logStream, { end: false })
      await new Promise<void>((resolvePromise, reject) => {
        server.once('spawn', () => resolvePromise())
        server.once('error', reject)
      })
      await waitReady(
        joinUrl(base, web.readinessPath),
        (options.timeoutSeconds ?? web.timeoutSeconds) * 1000,
        stop.signal,
      )
    } else {
      await waitReady(
        joinUrl(base, web.readinessPath),
        (options.timeoutSeconds ?? web.timeoutSeconds) * 1000,
        stop.signal,
      )
    }

    const browserStatus = chromiumStatus()
    if (!browserStatus.ok) throw new VerifyError('browser', base, browserStatus.detail)
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
      checks.push(...(await runVisitorFlow(page, base, outDir, { value: 0 })))
      await page.close()
    } finally {
      await browser.close()
    }
  } catch (error) {
    if (!stop.signal.aborted) {
      const message = error instanceof Error ? error.message : 'verify:visitor failed'
      checks.push({
        name: 'visitor',
        url: base,
        ok: false,
        detail: message,
        screenshot: null,
      })
    }
  } finally {
    await cleanup()
  }

  const git = gitMeta(root)
  const report: Report = {
    target: 'visitor',
    gitSha: git.gitSha,
    gitDirty: git.gitDirty,
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    reused,
    checks,
  }
  await writeFile(join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  await writeSummary(report, outDir)
  console.log(readFileSync(join(outDir, 'summary.md'), 'utf8'))
  return checks.every((check) => check.ok) ? 0 : 1
}

try {
  process.exitCode = await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : 'verify:visitor failed')
  process.exitCode = 1
}
