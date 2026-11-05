/**
 * Module-level constant naming (`CODING_STANDARDS.md`). Linux and macOS. No network.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))

const skipDirs = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.angular',
  '.next',
  'storybook-static',
  'artifacts',
])

const upperSnake = /^[A-Z][A-Z0-9_]*$/
const topLevelConst = /^\s*const\s+([A-Za-z_]\w*)\s*=([\s\S]*)/

/** Names left camelCase on purpose (schemas, tokens, route tables). */
const nameExclusions = [/Schema$/i, /^routes$/i, /Routes$/i, /Token$/i]

function isExcludedFile(path: string): boolean {
  if (path.endsWith('.spec.ts') || path.endsWith('.test.ts')) return true
  if (path.includes('/tests/')) return true
  if (path.endsWith('.stories.tsx') || path.endsWith('.stories.ts')) return true
  if (path.endsWith('/vite.config.ts')) return true
  if (path.endsWith('app.routes.ts')) return true
  if (path.endsWith('tools/guards/module-constants.ts')) return true
  return false
}

function isSourceFile(name: string): boolean {
  return (
    name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.mts') || name.endsWith('.cts')
  )
}

function walk(dir: string, out: string[]): void {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue
      walk(join(dir, entry.name), out)
      continue
    }
    if (entry.isFile() && isSourceFile(entry.name)) out.push(join(dir, entry.name))
  }
}

function listSourceRoots(): string[] {
  const paths: string[] = []
  for (const base of ['apps', 'libs', 'tools']) {
    walk(join(root, base), paths)
  }
  return paths
}

function skipName(name: string): boolean {
  return nameExclusions.some((pattern) => pattern.test(name))
}

function stripLineComment(line: string): string {
  let inSingle = false
  let inDouble = false
  let inTemplate = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === "'" && !inDouble && !inTemplate) inSingle = !inSingle
    else if (char === '"' && !inSingle && !inTemplate) inDouble = !inDouble
    else if (char === '`' && !inSingle && !inDouble) inTemplate = !inTemplate
    else if (char === '/' && line[index + 1] === '/' && !inSingle && !inDouble && !inTemplate) {
      return line.slice(0, index)
    }
  }
  return line
}

function updateDepth(line: string, depth: number): number {
  let inSingle = false
  let inDouble = false
  let inTemplate = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === "'" && !inDouble && !inTemplate) inSingle = !inSingle
    else if (char === '"' && !inSingle && !inTemplate) inDouble = !inDouble
    else if (char === '`' && !inSingle && !inDouble) inTemplate = !inTemplate
    if (inSingle || inDouble || inTemplate) continue
    if (char === '{') depth += 1
    else if (char === '}') depth -= 1
  }
  return depth
}

function isFixedScalar(init: string): boolean {
  const trimmed = init.trim()
  if (/^(['"`])/.test(trimmed)) return !trimmed.includes('${')
  if (/^-?\d/.test(trimmed)) return true
  if (/^(true|false|null)\b/.test(trimmed)) return true
  return false
}

function isObjectOrArrayInit(init: string): boolean {
  const trimmed = init.trim()
  return trimmed.startsWith('{') || trimmed.startsWith('[')
}

function hasTopLevelAsConst(init: string): boolean {
  return /\}\s*as\s+const\b/.test(init) || /\]\s*as\s+const\b/.test(init)
}

function braceBalance(text: string): number {
  let depth = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === "'" && !inDouble && !inTemplate) inSingle = !inSingle
    else if (char === '"' && !inSingle && !inTemplate) inDouble = !inDouble
    else if (char === '`' && !inSingle && !inDouble) inTemplate = !inTemplate
    if (inSingle || inDouble || inTemplate) continue
    if (char === '{' || char === '[') depth += 1
    else if (char === '}' || char === ']') depth -= 1
  }
  return depth
}

function isCompleteInit(init: string): boolean {
  const trimmed = init.trim()
  if (trimmed.length === 0) return false
  if (isFixedScalar(trimmed)) return true
  if (isObjectOrArrayInit(trimmed)) return braceBalance(trimmed) === 0
  return false
}

function isCallOrNewInit(init: string): boolean {
  const trimmed = init.trim()
  if (/^new\s+/.test(trimmed)) return true
  if (/^[A-Za-z_$]/.test(trimmed) && trimmed.includes('(') && !trimmed.startsWith('{')) {
    return true
  }
  if (/=>\s*\{/.test(trimmed) || /^function\b/.test(trimmed)) return true
  return false
}

type ModuleConst = { name: string; init: string }

function moduleConsts(source: string): ModuleConst[] {
  const lines = source.split('\n')
  const out: ModuleConst[] = []
  let depth = 0
  let pending: { name: string; initLines: string[] } | undefined
  for (const rawLine of lines) {
    const line = stripLineComment(rawLine)
    if (pending !== undefined) {
      pending.initLines.push(line)
      const init = pending.initLines
        .join('\n')
        .replace(/^\s*const\s+[A-Za-z_]\w*\s*=\s*/m, '')
        .replace(/;\s*$/, '')
      if (isCompleteInit(init)) {
        out.push({ name: pending.name, init })
        pending = undefined
      }
      depth = updateDepth(line, depth)
      continue
    }
    if (depth === 0) {
      const match = topLevelConst.exec(line)
      if (match !== null) {
        const name = match[1]
        const rest = match[2]
        const init = rest.trim()
        if (!isCompleteInit(init)) {
          pending = { name, initLines: [line] }
          depth = updateDepth(line, depth)
          continue
        }
        out.push({ name, init: init.replace(/;\s*$/, '') })
      }
    }
    depth = updateDepth(line, depth)
  }
  return out
}

function checkFile(path: string, failures: string[]): void {
  if (isExcludedFile(path)) return
  const rel = relative(root, path)
  const source = readFileSync(path, 'utf8')
  for (const { name, init } of moduleConsts(source)) {
    if (skipName(name)) continue
    if (isCallOrNewInit(init)) continue
    if (!isFixedScalar(init) && !isObjectOrArrayInit(init)) continue
    if (!upperSnake.test(name)) {
      failures.push(`${rel}: module constant \`${name}\` must be UPPER_SNAKE_CASE`)
    }
    if (isObjectOrArrayInit(init) && !hasTopLevelAsConst(init)) {
      failures.push(`${rel}: module constant \`${name}\` object or array must use \`as const\``)
    }
  }
}

export function moduleConstantFailures(): string[] {
  const failures: string[] = []
  for (const path of listSourceRoots()) checkFile(path, failures)
  failures.sort()
  return failures
}

export function assertModuleConstantSelfTest(): void {
  const sample = `
const OK_SCALAR = 'x'
const OK_OBJECT = { a: 1 } as const
const badName = 'y'
const BAD_SHAPE = { a: 1 }
function inner() {
  const localOk = 'z'
}
`
  const found = moduleConsts(sample)
  const failures: string[] = []
  for (const { name, init } of found) {
    if (isCallOrNewInit(init)) continue
    if (!isFixedScalar(init) && !isObjectOrArrayInit(init)) continue
    if (!upperSnake.test(name)) failures.push(name)
    if (isObjectOrArrayInit(init) && !hasTopLevelAsConst(init)) {
      failures.push(`${name}:as-const`)
    }
  }
  const expected = new Set(['badName', 'BAD_SHAPE:as-const'])
  if (failures.length !== expected.size || failures.some((item) => !expected.has(item))) {
    throw new Error(`module-constants self-test failed: ${failures.join(', ')}`)
  }
  if (found.some((item) => item.name === 'localOk')) {
    throw new Error('module-constants self-test failed: nested const')
  }
}

const entry = fileURLToPath(import.meta.url)
if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(entry)) {
  assertModuleConstantSelfTest()
  const failures = moduleConstantFailures()
  if (failures.length === 0) {
    console.log('module-constants: ok')
    process.exitCode = 0
  } else {
    console.log('module-constants: failed')
    for (const failure of failures) console.log(`- ${failure}`)
    process.exitCode = 1
  }
}
