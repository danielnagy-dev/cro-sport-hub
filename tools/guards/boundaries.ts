/** vpx tools/guards/boundaries.ts — studio feature import directions. Linux and macOS. No network. */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const studioApp = join(root, 'apps/studio/src/app')

type Zone =
  | { kind: 'feature'; name: string }
  | { kind: 'core' }
  | { kind: 'layout' }
  | { kind: 'root' }

const importPattern = /(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g

function posix(path: string): string {
  return path.split(sep).join('/')
}

function zoneForRel(dirRel: string): Zone {
  const parts = dirRel.split('/').filter((part) => part.length > 0 && part !== '.')
  if (parts.length === 0) return { kind: 'root' }
  if (parts[0] === 'feature' && parts[1] !== undefined) return { kind: 'feature', name: parts[1] }
  if (parts[0] === 'core') return { kind: 'core' }
  if (parts[0] === 'layout') return { kind: 'layout' }
  return { kind: 'root' }
}

function zoneForFile(absFile: string, appRoot: string): Zone {
  const rel = posix(relative(appRoot, absFile))
  if (rel.startsWith('..')) return { kind: 'root' }
  const dirRel = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '.'
  return zoneForRel(dirRel)
}

function zoneForImportTarget(
  fromFile: string,
  specifier: string,
  appRoot: string,
): Zone | undefined {
  if (!specifier.startsWith('.')) return undefined
  let resolved = resolve(dirname(fromFile), specifier)
  if (!existsSync(resolved) && existsSync(`${resolved}.ts`)) resolved = `${resolved}.ts`
  const rel = posix(relative(appRoot, resolved))
  if (rel.startsWith('..')) return undefined
  const dirRel = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '.'
  if (dirRel === '.') return zoneForFile(fromFile, appRoot)
  return zoneForRel(dirRel)
}

function violation(
  fromRel: string,
  specifier: string,
  fromZone: Zone,
  toZone: Zone,
): string | undefined {
  if (fromZone.kind === 'feature' && toZone.kind === 'feature' && fromZone.name !== toZone.name) {
    return `${fromRel}: illegal studio import (${specifier})`
  }
  if ((fromZone.kind === 'core' || fromZone.kind === 'layout') && toZone.kind === 'feature') {
    return `${fromRel}: illegal studio import (${specifier})`
  }
  return undefined
}

export function violationsFor(
  appRoot: string,
  files: ReadonlyMap<string, readonly string[]>,
  sharedDirs: readonly string[],
): string[] {
  const failures: string[] = []
  for (const dir of sharedDirs) {
    failures.push(`${dir}: feature-shared folder is not allowed`)
  }
  for (const [fromRel, specifiers] of files) {
    const fromFile = join(appRoot, fromRel)
    const fromZone = zoneForFile(fromFile, appRoot)
    for (const specifier of specifiers) {
      const toZone = zoneForImportTarget(fromFile, specifier, appRoot)
      if (toZone === undefined) continue
      const hit = violation(fromRel, specifier, fromZone, toZone)
      if (hit !== undefined) failures.push(hit)
    }
  }
  return failures
}

function collectSources(dir: string, appRoot: string, files: Map<string, string[]>): void {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      collectSources(path, appRoot, files)
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith('.ts')) continue
    const rel = posix(relative(appRoot, path))
    const specifiers: string[] = []
    const text = readFileSync(path, 'utf8')
    for (const match of text.matchAll(importPattern)) {
      const specifier = match[1]
      if (specifier !== undefined && specifier.startsWith('.')) specifiers.push(specifier)
    }
    files.set(rel, specifiers)
  }
}

function featureSharedDirs(appRoot: string): string[] {
  const hits: string[] = []
  function walk(dir: string): void {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue
      const path = join(dir, entry.name)
      if (entry.name === 'feature-shared') hits.push(posix(relative(appRoot, path)))
      walk(path)
    }
  }
  walk(appRoot)
  return hits
}

export function studioBoundaryFailures(): string[] {
  if (!existsSync(studioApp)) return []
  const files = new Map<string, string[]>()
  collectSources(studioApp, studioApp, files)
  return violationsFor(studioApp, files, featureSharedDirs(studioApp))
}

function expectFailures(reported: readonly string[], expected: readonly string[]): void {
  const same =
    reported.length === expected.length &&
    reported.every((failure, index) => failure === expected[index])
  if (!same) throw new Error('self-test failed: studio boundaries')
}

export function assertBoundarySelfTest(): void {
  const appRoot = join(root, 'apps/studio/src/app')
  expectFailures(
    violationsFor(
      appRoot,
      new Map([
        ['feature/login/login.ts', ['../../core/auth']],
        ['feature/editor/shell.ts', ['../../core/auth', './editor.store']],
        ['core/auth.ts', ['./studio-http']],
        ['feature/login/bad.ts', ['../editor/shell']],
        ['core/bad.ts', ['../feature/login/login']],
      ]),
      [],
    ),
    [
      'feature/login/bad.ts: illegal studio import (../editor/shell)',
      'core/bad.ts: illegal studio import (../feature/login/login)',
    ],
  )
  expectFailures(violationsFor(appRoot, new Map(), ['feature/feature-shared']), [
    'feature/feature-shared: feature-shared folder is not allowed',
  ])
  expectFailures(violationsFor(appRoot, new Map([['core/auth.spec.ts', ['../app']]]), []), [])
}

function main(): number {
  assertBoundarySelfTest()
  const failures = studioBoundaryFailures()
  if (failures.length === 0) {
    console.log('boundaries: ok')
    return 0
  }
  console.log('boundaries: failed')
  for (const failure of failures) console.log(`- ${failure}`)
  return 1
}

const entry = process.argv[1]
if (entry !== undefined && resolve(entry) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'boundaries failed')
    process.exitCode = 1
  }
}
