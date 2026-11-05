/**
 * File size guard: bytes/4 estimated tokens, limit 5000.
 * Pre-commit: `.githooks/pre-commit` runs `vpx tools/guards/file-size.ts --staged`
 * (staged index blobs only). CI and `vp run lint` run without `--staged` on tracked files.
 * Ignore rules and baseline: `file-size.config.json` beside this script.
 * Linux and macOS. No network.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const limit = 5000

export type FileSizeConfig = {
  readonly exact: readonly string[]
  readonly prefixes: readonly string[]
  readonly catalogSqlDir: string
  readonly suffixes: readonly string[]
  readonly generatedDirNames: readonly string[]
  readonly baseline: readonly string[]
}

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

export const splitInstructions =
  'Split by responsibility into smaller modules (e.g. one component/service/route per file, move helpers and types out, move fixtures/test data to separate files), keep each file under the limit, then re-stage.'

type Sized = { readonly path: string; readonly bytes: number }

export function loadConfig(configPath = join(here, 'file-size.config.json')): FileSizeConfig {
  const raw = JSON.parse(readFileSync(configPath, 'utf8')) as FileSizeConfig
  return raw
}

export function tokens(bytes: number): number {
  return bytes / 4
}

export function over(bytes: number): boolean {
  return tokens(bytes) > limit
}

export function ignored(path: string, config: FileSizeConfig): boolean {
  if (config.exact.includes(path) || config.prefixes.some((prefix) => path.startsWith(prefix))) {
    return true
  }
  if (config.suffixes.some((suffix) => path.endsWith(suffix))) return true
  if (path.split('/').some((part) => config.generatedDirNames.includes(part))) return true
  if (path === 'openapi.json' || path.endsWith('/openapi.json')) return true
  const rest = path.startsWith(config.catalogSqlDir)
    ? path.slice(config.catalogSqlDir.length)
    : undefined
  return rest !== undefined && rest.endsWith('.sql') && !rest.includes('/')
}

export function failureMessage(path: string, bytes: number): string {
  return `${path}: ${tokens(bytes)} estimated tokens (bytes/4), limit ${limit}. ${splitInstructions}`
}

export function failuresFor(
  files: readonly Sized[],
  skipped: ReadonlySet<string>,
  config: FileSizeConfig,
): string[] {
  const baseline = new Set(config.baseline)
  const hits: string[] = []
  for (const file of files) {
    if (skipped.has(file.path) || ignored(file.path, config) || baseline.has(file.path)) continue
    if (!over(file.bytes)) continue
    hits.push(failureMessage(file.path, file.bytes))
  }
  return hits
}

function exitStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined
  return typeof error.status === 'number' ? error.status : undefined
}

function git(args: readonly string[], cwd: string, input?: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

export function gitignored(paths: readonly string[], cwd = root): Set<string> {
  if (paths.length === 0) return new Set()
  try {
    return new Set(
      git(['check-ignore', '--no-index', '--stdin', '-z'], cwd, `${paths.join('\0')}\0`)
        .split('\0')
        .filter((path) => path !== ''),
    )
  } catch (error) {
    if (exitStatus(error) === 1) return new Set()
    throw error
  }
}

function listed(staged: boolean, cwd: string): string[] {
  const args = staged
    ? ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']
    : ['ls-files', '-z']
  return git(args, cwd)
    .split('\0')
    .filter((path) => path !== '')
}

export function stagedBytes(path: string, cwd = root): number | undefined {
  try {
    const size = git(['cat-file', '-s', `:${path}`], cwd).trim()
    const bytes = Number.parseInt(size, 10)
    return Number.isNaN(bytes) ? undefined : bytes
  } catch (error) {
    if (exitStatus(error) === 128) return undefined
    throw error
  }
}

function worktreeBytes(path: string, cwd: string): number | undefined {
  const abs = join(cwd, path)
  if (!existsSync(abs)) return undefined
  return statSync(abs).size
}

function sized(paths: readonly string[], staged: boolean, cwd: string): Sized[] {
  const files: Sized[] = []
  for (const path of paths) {
    const bytes = staged ? stagedBytes(path, cwd) : worktreeBytes(path, cwd)
    if (bytes === undefined) continue
    files.push({ path, bytes })
  }
  return files
}

function main(): number {
  const args = process.argv.slice(2)
  if (args.length > 1 || (args[0] !== undefined && args[0] !== '--staged')) {
    throw new Error('Usage: vpx tools/guards/file-size.ts [--staged]')
  }
  const staged = args[0] === '--staged'
  const config = loadConfig()
  const paths = listed(staged, root)
  const hits = failuresFor(sized(paths, staged, root), gitignored(paths, root), config)
  if (hits.length === 0) {
    console.log('file-size: ok')
    return 0
  }
  console.log('file-size: failed')
  for (const hit of hits) console.log(`- ${hit}`)
  return 1
}

const entry = process.argv[1]
const isMain = entry !== undefined && resolve(entry) === resolve(fileURLToPath(import.meta.url))

if (isMain) {
  try {
    process.exitCode = main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'file-size failed')
    process.exitCode = 1
  }
}
