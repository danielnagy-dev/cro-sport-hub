/**
 * Fail when `.scratch/` is tracked or when tracked files mention that path.
 * Wired from `tools/guards/check.ts` (CI lint and `vp run guards`).
 * Linux and macOS. No network.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))

export const mentionNeedle = '.scratch/'

/** Paths that may mention the retired folder (this guard and its tests only). */
export const mentionAllowlist = new Set([
  'tools/guards/no-scratch.ts',
  'tools/guards/no-scratch.test.ts',
  'tools/guards/pr-size.ts',
  'tools/guards/pr-size.test.ts',
])

export function trackedScratchPaths(paths: readonly string[]): string[] {
  const hits: string[] = []
  for (const path of paths) {
    if (path === '.scratch' || path.startsWith('.scratch/')) hits.push(path)
  }
  return hits.sort()
}

export function mentionFailures(
  paths: readonly string[],
  readText: (path: string) => string,
  allowlist: ReadonlySet<string> = mentionAllowlist,
): string[] {
  const failures: string[] = []
  for (const path of paths) {
    if (allowlist.has(path)) continue
    const lines = readText(path).split('\n')
    for (let index = 0; index < lines.length; index += 1) {
      if ((lines[index] ?? '').includes(mentionNeedle)) {
        failures.push(`${path}:${index + 1}: mentions ${mentionNeedle}`)
        break
      }
    }
  }
  return failures.sort()
}

function git(args: readonly string[]): string {
  return execFileSync('git', [...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function listTrackedFiles(): string[] {
  return git(['ls-files', '-z'])
    .split('\0')
    .filter((path) => path !== '')
}

export function noScratchFailures(
  tracked: readonly string[] = listTrackedFiles(),
  readText: (path: string) => string = (path) => readFileSync(resolve(root, path), 'utf8'),
): string[] {
  const failures: string[] = []
  for (const path of trackedScratchPaths(tracked)) {
    failures.push(`${path}: tracked path under ${mentionNeedle}`)
  }
  failures.push(...mentionFailures(tracked, readText))
  return failures
}

function main(): number {
  const failures = noScratchFailures()
  if (failures.length === 0) {
    console.log('no-scratch: ok')
    return 0
  }
  console.log('no-scratch: failed')
  for (const failure of failures) console.log(`- ${failure}`)
  return 1
}

const entry = process.argv[1]
const isMain = entry !== undefined && resolve(entry) === resolve(fileURLToPath(import.meta.url))

if (isMain) {
  try {
    process.exitCode = main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'no-scratch failed')
    process.exitCode = 1
  }
}
