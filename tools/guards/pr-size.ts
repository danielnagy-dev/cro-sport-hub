/** vpx tools/guards/pr-size.ts [--base <ref>] — PR counted-line cap. Linux and macOS. No network. */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const limit = 500

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))

const exactExcluded = new Set(['pnpm-lock.yaml', 'skills-lock.json'])

export type SkillsLock = { skills?: Record<string, unknown> }

export function skillNamesFromLock(lock: SkillsLock): string[] {
  return Object.keys(lock.skills ?? {}).sort()
}

export function excludedFromCount(path: string, skillNames: readonly string[]): boolean {
  if (exactExcluded.has(path)) return true
  if (path.startsWith('.scratch/')) return true
  for (const name of skillNames) {
    const prefix = `.agents/skills/${name}/`
    if (path.startsWith(prefix)) return true
  }
  return false
}

export function countFromNumstat(numstat: string, skillNames: readonly string[]): number {
  let total = 0
  for (const line of numstat.split('\n')) {
    if (line === '') continue
    const parts = line.split('\t')
    if (parts.length < 3) continue
    const added = Number(parts[0])
    const deleted = Number(parts[1])
    if (Number.isNaN(added) || Number.isNaN(deleted)) continue
    const path = parts.slice(2).join('\t')
    if (excludedFromCount(path, skillNames)) continue
    total += added + deleted
  }
  return total
}

export function overLimit(count: number, cap = limit): boolean {
  return count > cap
}

export function failureMessage(count: number, cap = limit): string | undefined {
  if (count <= cap) return undefined
  return `PR size: ${count} counted lines (insertions plus deletions, with the plan skill exclusions), limit ${cap}. Split this PR.`
}

function git(args: readonly string[]): string {
  return execFileSync('git', [...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function loadSkillNames(): string[] {
  const raw = readFileSync(join(root, 'skills-lock.json'), 'utf8')
  return skillNamesFromLock(JSON.parse(raw) as SkillsLock)
}

function defaultBaseRef(): string {
  const base = process.env.GITHUB_BASE_REF
  if (base !== undefined && base !== '') return `origin/${base}`
  return 'origin/main'
}

function parseArgs(argv: readonly string[]): { base: string } {
  let base = defaultBaseRef()
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (flag !== '--base') {
      throw new Error('Usage: vpx tools/guards/pr-size.ts [--base <ref>]')
    }
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new Error('Usage: vpx tools/guards/pr-size.ts [--base <ref>]')
    }
    base = value
    index += 1
  }
  return { base }
}

export function countedLinesForRef(baseRef: string, skillNames: readonly string[]): number {
  const numstat = git(['diff', '--numstat', `${baseRef}...HEAD`])
  return countFromNumstat(numstat, skillNames)
}

function main(): number {
  const options = parseArgs(process.argv.slice(2))
  const skillNames = loadSkillNames()
  const count = countedLinesForRef(options.base, skillNames)
  if (!overLimit(count)) {
    console.log(`pr-size: ok (${count} counted lines, limit ${limit})`)
    return 0
  }
  const message = failureMessage(count)
  console.log('pr-size: failed')
  console.log(`- ${message}`)
  return 1
}

const entry = fileURLToPath(import.meta.url)
if (process.argv[1] !== undefined && resolve(process.argv[1]) === entry) {
  try {
    process.exitCode = main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'pr-size failed')
    process.exitCode = 1
  }
}
