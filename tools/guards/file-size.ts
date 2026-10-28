/** vpx tools/guards/file-size.ts [--staged]. Tokens are bytes/4. Linux and macOS. No network. */
import { execFileSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const limit = 5000

/**
 * Ignore list. Do not add a path to pass. An exception needs Daniel's OK in the PR body.
 * Lockfiles, catalog SQL migrations, seed data, the design handoff, fonts, images, binaries,
 * generated and build output (including OpenAPI JSON), and verbatim vendored text.
 * Gitignored paths are skipped in the scan (`git check-ignore`), including a forced add.
 */
const exact = new Set([
  'pnpm-lock.yaml',
  'apps/api/src/catalog/seed.ts',
  '.cursor/rules/angular-best-practices.mdc',
])
const prefixes = ['.agents/skills/', 'libs/slide-generator/design/']
const catalogSql = 'apps/api/src/catalog/'
const suffixes = [
  '.lock',
  '.ttf',
  '.otf',
  '.woff',
  '.woff2',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.svg',
  '.pdf',
  '.bin',
  '.tsbuildinfo',
]
const generated = new Set([
  'node_modules',
  'dist',
  'dist-ssr',
  '.next',
  '.angular',
  'coverage',
  'storybook-static',
  'artifacts',
  'out',
  'out-tsc',
  'test-results',
])

/** Temporary baseline: already over the limit. Do not add a path. Split the file instead. */
const baseline = new Set([
  'tools/verify/verify.ts', // 31920 bytes, 7980 estimated tokens, 2026-10-26
])

const split =
  "Split by responsibility (one reason to change per file), not by line count. Keep public imports stable, for example via an index.ts re-export. Move tests next to the code they test, one spec per unit. Never raise the limit or add the file to the ignore list to pass. An exception needs Daniel's OK in the PR body."

type Sized = { readonly path: string; readonly bytes: number }

function tokens(bytes: number): number {
  return bytes / 4
}

function over(bytes: number): boolean {
  return tokens(bytes) > limit
}

function ignored(path: string): boolean {
  if (exact.has(path) || prefixes.some((prefix) => path.startsWith(prefix))) return true
  if (suffixes.some((suffix) => path.endsWith(suffix))) return true
  if (path.split('/').some((part) => generated.has(part))) return true
  if (path === 'openapi.json' || path.endsWith('/openapi.json')) return true
  const rest = path.startsWith(catalogSql) ? path.slice(catalogSql.length) : undefined
  return rest !== undefined && rest.endsWith('.sql') && !rest.includes('/')
}

function report(path: string, bytes: number): string {
  return `${path}: ${tokens(bytes)} estimated tokens (bytes/4), limit ${limit}. ${split}`
}

function failuresFor(files: readonly Sized[], skipped: ReadonlySet<string>): string[] {
  const hits: string[] = []
  for (const file of files) {
    if (skipped.has(file.path) || ignored(file.path) || baseline.has(file.path)) continue
    if (!over(file.bytes)) continue
    hits.push(report(file.path, file.bytes))
  }
  return hits
}

function exitStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined
  return typeof error.status === 'number' ? error.status : undefined
}

function git(args: readonly string[], input?: string): string {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

function gitignored(paths: readonly string[]): Set<string> {
  if (paths.length === 0) return new Set()
  try {
    return new Set(
      git(['check-ignore', '--no-index', '--stdin', '-z'], `${paths.join('\0')}\0`)
        .split('\0')
        .filter((path) => path !== ''),
    )
  } catch (error) {
    if (exitStatus(error) === 1) return new Set()
    throw error
  }
}

function listed(staged: boolean): string[] {
  const args = staged
    ? ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']
    : ['ls-files', '-z']
  return git(args)
    .split('\0')
    .filter((path) => path !== '')
}

function sized(paths: readonly string[]): Sized[] {
  const files: Sized[] = []
  for (const path of paths) {
    const abs = join(root, path)
    if (!existsSync(abs)) continue
    files.push({ path, bytes: statSync(abs).size })
  }
  return files
}

function assertSelfTest(): void {
  if (tokens(20000) !== 5000 || tokens(20004) !== 5001 || over(20000) || !over(20001)) {
    throw new Error('self-test failed: token estimate')
  }
  if (
    ignored('notes.log') ||
    ignored('apps/api/src/catalog/seed.spec.ts') ||
    ignored('libs/slide-generator/src/football.ts')
  ) {
    throw new Error('self-test failed: ignore list')
  }
  const expected =
    "apps/api/src/big.ts: 5001 estimated tokens (bytes/4), limit 5000. Split by responsibility (one reason to change per file), not by line count. Keep public imports stable, for example via an index.ts re-export. Move tests next to the code they test, one spec per unit. Never raise the limit or add the file to the ignore list to pass. An exception needs Daniel's OK in the PR body."
  const files: Sized[] = [
    'pnpm-lock.yaml',
    'dir/foo.lock',
    'apps/api/src/catalog/seed.ts',
    'apps/api/src/catalog/0005_v1_credentials.sql',
    'libs/slide-generator/design/football-r13/fonts/Archivo.ttf',
    '.cursor/rules/angular-best-practices.mdc',
    '.agents/skills/tdd/SKILL.md',
    'artifacts/verify/openapi.json',
    'apps/web/.next/server.js',
    'tools/verify/verify.ts',
    'notes.log',
    'apps/api/src/ok.ts',
  ].map((path) => ({ path, bytes: path === 'apps/api/src/ok.ts' ? 20000 : 400000 }))
  files.push({ path: 'apps/api/src/big.ts', bytes: 20004 })
  const hits = failuresFor(files, new Set(['notes.log']))
  if (hits.length !== 1) throw new Error('self-test failed: ignore list')
  if (hits[0] !== expected) throw new Error('self-test failed: error message')
  if (failuresFor([{ path: 'apps/api/src/edge.ts', bytes: 20001 }], new Set()).length !== 1) {
    throw new Error('self-test failed: token estimate')
  }
  const real = gitignored(['notes.log', 'tools/guards/file-size.ts'])
  if (!real.has('notes.log') || real.has('tools/guards/file-size.ts')) {
    throw new Error('self-test failed: ignore list')
  }
}

function main(): number {
  const args = process.argv.slice(2)
  if (args.length > 1 || (args[0] !== undefined && args[0] !== '--staged')) {
    throw new Error('Usage: vpx tools/guards/file-size.ts [--staged]')
  }
  assertSelfTest()
  const paths = listed(args[0] === '--staged')
  const hits = failuresFor(sized(paths), gitignored(paths))
  if (hits.length === 0) {
    console.log('file-size: ok')
    return 0
  }
  console.log('file-size: failed')
  for (const hit of hits) console.log(`- ${hit}`)
  return 1
}

try {
  process.exitCode = main()
} catch (error) {
  console.error(error instanceof Error ? error.message : 'file-size failed')
  process.exitCode = 1
}
