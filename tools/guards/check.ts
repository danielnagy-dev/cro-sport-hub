/** vpx tools/guards/check.ts [--pr-body <file>] — see docs/lessons.md. Linux and macOS. No network. */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertBoundarySelfTest, studioBoundaryFailures } from './boundaries.ts'
import { noScratchFailures } from './no-scratch.ts'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))

const skip = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.angular',
  '.next',
  'storybook-static',
  'artifacts',
])

function procNeedle(): string {
  return String.fromCharCode(47, 112, 114, 111, 99, 47)
}

function trailerHasEmail(text: string): boolean {
  return text.split('\n').some((line) => /^[ \t]*co-authored-by:.*@/i.test(line))
}

function uncovered(command: string, projects: readonly string[]): string[] {
  return projects.filter((project) => !command.includes(project))
}

function assertSelfTest(): void {
  const needle = procNeedle()
  if (needle.length !== 6 || needle.charCodeAt(0) !== 47 || needle.charCodeAt(1) !== 112) {
    throw new Error('self-test failed: proc needle')
  }
  if (!`x ${needle} y`.includes(needle) || 'process.cwd()'.includes(needle)) {
    throw new Error('self-test failed: proc needle')
  }
  const at = ['agent', 'example.test'].join('@')
  if (!trailerHasEmail(`Co-authored-by: Agent <${at}>`)) {
    throw new Error('self-test failed: trailer')
  }
  if (!trailerHasEmail(`  co-authored-by: Agent <${at}>`)) {
    throw new Error('self-test failed: trailer')
  }
  if (
    trailerHasEmail('Co-authored-by: Agent') ||
    trailerHasEmail(`Mention Co-authored-by near ${at}`)
  ) {
    throw new Error('self-test failed: trailer')
  }
  assertVendoredSkillProbe()
  assertBoundarySelfTest()
  const missed = uncovered('tsc -p tools/verify/tsconfig.json', [
    'tools/verify/tsconfig.json',
    'tools/guards/tsconfig.json',
  ])
  if (missed.length !== 1 || missed[0] !== 'tools/guards/tsconfig.json') {
    throw new Error('self-test failed: typecheck coverage')
  }
}

function git(args: readonly string[]): string {
  return execFileSync('git', [...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function tryGit(args: readonly string[]): string | undefined {
  try {
    return git(args)
  } catch {
    return undefined
  }
}

function isSource(name: string): boolean {
  return /\.(?:ts|tsx|mts|cts|js|mjs|cjs)$/.test(name)
}

function collectSources(dir: string, files: string[]): void {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink() || skip.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) collectSources(path, files)
    else if (entry.isFile() && isSource(entry.name)) files.push(path)
  }
}

function posix(path: string): string {
  return relative(root, path).split(sep).join('/')
}

function procFailures(): string[] {
  const needle = procNeedle()
  const files: string[] = []
  for (const name of ['apps', 'libs', 'tools']) collectSources(join(root, name), files)
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && isSource(entry.name)) files.push(join(root, entry.name))
  }
  const hits: string[] = []
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n')
    for (let index = 0; index < lines.length; index += 1) {
      if ((lines[index] ?? '').includes(needle)) {
        hits.push(`${posix(file)}:${index + 1}: Linux-only proc path`)
      }
      if (hits.length >= 30) return [...hits, 'further proc hits omitted']
    }
  }
  return hits
}

function mergeBase(): string | undefined {
  for (const ref of ['origin/main', 'main']) {
    if (tryGit(['rev-parse', '--verify', '--quiet', ref]) === undefined) continue
    const base = tryGit(['merge-base', 'HEAD', ref])?.trim()
    if (base) return base
  }
  return undefined
}

function commitScan(): { label: string; failures: string[] } {
  const base = mergeBase()
  if (base === undefined) {
    const text = tryGit(['log', '-1', '--format=%H%n%B']) ?? ''
    return { label: 'HEAD only (main ref not found)', failures: trailerHits(text) }
  }
  const text = tryGit(['log', '--format=%H%n%B%x1e', `${base}..HEAD`]) ?? ''
  return { label: `${base.slice(0, 12)}..HEAD`, failures: trailerHits(text) }
}

function trailerHits(text: string): string[] {
  const failures: string[] = []
  for (const chunk of text.split('\u001e')) {
    if (!trailerHasEmail(chunk)) continue
    const sha = chunk.trim().split('\n')[0] ?? 'commit'
    failures.push(`${sha}: Co-authored-by line contains an email`)
  }
  return failures
}

function typecheckCommand(config: string): string {
  const objectForm = /typecheck:\s*\{[\s\S]*?command:\s*(['"])([^'"]+)\1/.exec(config)
  if (objectForm?.[2] !== undefined) return objectForm[2]
  const stringForm = /typecheck:\s*(['"])([^'"]+)\1/.exec(config)
  return stringForm?.[2] ?? ''
}

function typecheckFailures(): string[] {
  const toolsDir = join(root, 'tools')
  const command = typecheckCommand(readFileSync(join(root, 'vite.config.ts'), 'utf8'))
  const projects: string[] = []
  for (const entry of readdirSync(toolsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue
    const sources: string[] = []
    collectSources(join(toolsDir, entry.name), sources)
    if (sources.length === 0) continue
    projects.push(`tools/${entry.name}/tsconfig.json`)
  }
  return uncovered(command, projects).map((project) =>
    existsSync(join(root, project))
      ? `${project}: not in the root typecheck command`
      : `${project}: missing, and the directory has TypeScript files`,
  )
}

const BLOCKED_SKILLS = new Set([
  'implement',
  'implement-spec',
  'pr',
  'setup-matt-pocock-skills',
  'to-spec',
  'triage',
  'wayfinder',
  'wizard',
])

const FULL_SHA = /^[0-9a-f]{40}$/

function vendoredSkillProblems(
  vendored: readonly string[],
  cursorSkillNames: readonly string[],
  symlinks: readonly string[],
  lock: ReadonlyMap<string, string> | undefined,
  lockError: string | undefined,
): string[] {
  const failures: string[] = []
  for (const name of symlinks) failures.push(`.agents/skills/${name}: symlink`)
  if (lockError !== undefined) failures.push(lockError)
  const cursorSkills = new Set(cursorSkillNames)
  const vendoredSet = new Set(vendored)
  const locked = new Set(lock === undefined ? [] : lock.keys())
  for (const name of new Set([...vendored, ...locked, ...symlinks])) {
    if (BLOCKED_SKILLS.has(name)) failures.push(`${name}: blocked skill`)
  }
  for (const name of vendored) {
    if (cursorSkills.has(name)) {
      failures.push(`.agents/skills/${name}: clashes with .cursor/skills/${name}`)
    }
  }
  if (lock === undefined) {
    if (vendored.length > 0 && lockError === undefined) failures.push('skills-lock.json: missing')
    return failures
  }
  for (const name of vendored) {
    const ref = lock.get(name)
    if (ref === undefined) {
      failures.push(`.agents/skills/${name}: no skills-lock.json entry`)
      continue
    }
    if (!FULL_SHA.test(ref)) failures.push(`.agents/skills/${name}: ref is not a full SHA`)
  }
  for (const [name, ref] of lock) {
    if (vendoredSet.has(name)) continue
    failures.push(`skills-lock.json ${name}: no .agents/skills folder`)
    if (!FULL_SHA.test(ref)) failures.push(`skills-lock.json ${name}: ref is not a full SHA`)
  }
  return failures
}

function expectFailures(reportedFailures: readonly string[], expected: readonly string[]): void {
  const same =
    reportedFailures.length === expected.length &&
    reportedFailures.every((failure, index) => failure === expected[index])
  if (!same) throw new Error('self-test failed: vendored skills')
}

function assertVendoredSkillProbe(): void {
  const sha = 'ab'.repeat(20)
  const cases: { reportedFailures: string[]; expected: string[] }[] = [
    {
      reportedFailures: vendoredSkillProblems(
        ['tdd'],
        ['plan'],
        [],
        new Map([['tdd', sha]]),
        undefined,
      ),
      expected: [],
    },
    {
      reportedFailures: vendoredSkillProblems([], ['plan'], [], undefined, undefined),
      expected: [],
    },
    {
      reportedFailures: vendoredSkillProblems(
        ['tdd'],
        [],
        [],
        new Map([['tdd', 'main']]),
        undefined,
      ),
      expected: ['.agents/skills/tdd: ref is not a full SHA'],
    },
    {
      reportedFailures: vendoredSkillProblems(
        ['tdd'],
        [],
        [],
        new Map([['tdd', 'A'.repeat(40)]]),
        undefined,
      ),
      expected: ['.agents/skills/tdd: ref is not a full SHA'],
    },
    {
      reportedFailures: vendoredSkillProblems(['tdd'], [], [], new Map(), undefined),
      expected: ['.agents/skills/tdd: no skills-lock.json entry'],
    },
    {
      reportedFailures: vendoredSkillProblems(['tdd'], [], [], undefined, undefined),
      expected: ['skills-lock.json: missing'],
    },
    {
      reportedFailures: vendoredSkillProblems(
        ['review'],
        ['review'],
        [],
        new Map([['review', sha]]),
        undefined,
      ),
      expected: ['.agents/skills/review: clashes with .cursor/skills/review'],
    },
    {
      reportedFailures: vendoredSkillProblems([], [], ['tdd'], new Map(), undefined),
      expected: ['.agents/skills/tdd: symlink'],
    },
    {
      reportedFailures: vendoredSkillProblems([], [], [], new Map([['tdd', 'main']]), undefined),
      expected: [
        'skills-lock.json tdd: no .agents/skills folder',
        'skills-lock.json tdd: ref is not a full SHA',
      ],
    },
  ]
  for (const item of cases) expectFailures(item.reportedFailures, item.expected)
  for (const name of BLOCKED_SKILLS) {
    expectFailures(vendoredSkillProblems([name], [], [], new Map([[name, sha]]), undefined), [
      `${name}: blocked skill`,
    ])
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function listChildDirs(dir: string): { names: string[]; symlinks: string[] } {
  if (!existsSync(dir)) return { names: [], symlinks: [] }
  const names: string[] = []
  const symlinks: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) symlinks.push(entry.name)
    else if (entry.isDirectory()) names.push(entry.name)
  }
  return { names, symlinks }
}

function readSkillLock(): { lock?: Map<string, string>; error?: string } {
  const path = join(root, 'skills-lock.json')
  if (!existsSync(path)) return {}
  let value: unknown
  try {
    value = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return { error: 'skills-lock.json: invalid JSON' }
  }
  if (!isRecord(value) || !isRecord(value.skills))
    return { error: 'skills-lock.json: missing skills' }
  const lock = new Map<string, string>()
  for (const [name, entry] of Object.entries(value.skills)) {
    lock.set(name, isRecord(entry) && typeof entry.ref === 'string' ? entry.ref : '')
  }
  return { lock }
}

function vendoredSkillFailures(): string[] {
  const vendored = listChildDirs(join(root, '.agents', 'skills'))
  const cursorSkills = listChildDirs(join(root, '.cursor', 'skills'))
  const read = readSkillLock()
  return vendoredSkillProblems(
    vendored.names,
    cursorSkills.names,
    vendored.symlinks,
    read.lock,
    read.error,
  )
}

function prBodyFailures(path: string | undefined): { note: string; failures: string[] } {
  if (path === undefined) return { note: 'pr-body: skipped', failures: [] }
  const abs = resolve(root, path)
  if (!existsSync(abs))
    return { note: 'pr-body: missing', failures: [`pr body not found: ${path}`] }
  if (trailerHasEmail(readFileSync(abs, 'utf8'))) {
    return {
      note: 'pr-body: failed',
      failures: [`${path}: Co-authored-by line contains an email`],
    }
  }
  return { note: 'pr-body: ok', failures: [] }
}

function parseArgs(argv: readonly string[]): { prBody?: string } {
  const options: { prBody?: string } = {}
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (flag !== '--pr-body') throw new Error('Usage: vpx tools/guards/check.ts [--pr-body <file>]')
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new Error('Usage: vpx tools/guards/check.ts [--pr-body <file>]')
    }
    options.prBody = value
    index += 1
  }
  return options
}

function main(): number {
  assertSelfTest()
  const options = parseArgs(process.argv.slice(2))
  const commits = commitScan()
  const prBody = prBodyFailures(options.prBody)
  const failures = [
    ...procFailures(),
    ...commits.failures,
    ...prBody.failures,
    ...typecheckFailures(),
    ...vendoredSkillFailures(),
    ...studioBoundaryFailures(),
    ...noScratchFailures(),
  ]
  console.log(`commits scanned: ${commits.label}`)
  console.log(prBody.note)
  if (failures.length === 0) {
    console.log('guards: ok')
    return 0
  }
  console.log('guards: failed')
  for (const failure of failures) console.log(`- ${failure}`)
  return 1
}

try {
  process.exitCode = main()
} catch (error) {
  console.error(error instanceof Error ? error.message : 'guards failed')
  process.exitCode = 1
}
