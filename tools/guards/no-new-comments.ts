/**
 * Ratchet: a new prose comment under apps/ or libs/ fails.
 * Directives, license headers, and the football design handoff are allowed.
 * Deleting a baselined comment does not fail. Linux and macOS. No network.
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const baselinePath = fileURLToPath(new URL('./comment-baseline.txt', import.meta.url))

const skipDirs = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.angular',
  '.next',
  'storybook-static',
  'design',
])

const sourceExt = /\.(?:ts|tsx|mts|cts|js|mjs|cjs|css|scss|html)$/
const directive =
  /^(?:eslint-disable|eslint-enable|eslint-env|oxlint-disable|oxlint-enable|@ts-expect-error|@ts-ignore|@ts-nocheck|@ts-check|istanbul ignore|c8 ignore|prettier-ignore|oxfmt-ignore|biome-ignore|@vite-ignore|vite-ignore|<reference)\b/

type Frame = { kind: 'code' | "'" | '"' | '`'; braces: number }

export function proseComments(source: string): string[] {
  const found: string[] = []
  const stack: Frame[] = [{ kind: 'code', braces: 0 }]
  let index = 0
  while (index < source.length) {
    const frame = stack[stack.length - 1]
    if (frame === undefined) break
    const char = source[index]
    const next = source[index + 1]
    if (frame.kind === 'code') {
      if (char === '/' && next === '/') {
        const start = index
        index += 2
        while (index < source.length && source[index] !== '\n') index += 1
        const raw = source.slice(start, index)
        if (!allowed(raw)) found.push(raw)
        continue
      }
      if (char === '/' && next === '*') {
        const start = index
        index += 2
        while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
          index += 1
        }
        index = Math.min(source.length, index + 2)
        const raw = source.slice(start, index)
        if (!allowed(raw)) found.push(raw)
        continue
      }
      if (char === "'" || char === '"' || char === '`') {
        stack.push({ kind: char, braces: 0 })
        index += 1
        continue
      }
      if (char === '{') frame.braces += 1
      else if (char === '}') {
        if (frame.braces > 0) frame.braces -= 1
        else if (stack.length > 1) stack.pop()
      }
      index += 1
      continue
    }
    if (char === '\\') {
      index += 2
      continue
    }
    if (frame.kind === '`' && char === '$' && next === '{') {
      stack.push({ kind: 'code', braces: 0 })
      index += 2
      continue
    }
    if (char === frame.kind) stack.pop()
    else if (char === '\n' && frame.kind !== '`') stack.pop()
    index += 1
  }
  return found
}

function commentBody(raw: string): string {
  if (raw.startsWith('//')) return raw.replace(/^\/+/, '')
  return raw.replace(/^\/\*+/, '').replace(/\*\/$/, '')
}

function allowed(raw: string): boolean {
  const body = commentBody(raw)
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter((line) => line.length > 0)
  if (body.length === 0) return false
  if (body.every((line) => directive.test(line))) return true
  return /copyright|SPDX-License-Identifier|Apache License|MIT License/i.test(raw)
}

export function normalizeComment(raw: string): string {
  return commentBody(raw)
    .replace(/^\s*\*\s?/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function commentFingerprint(path: string, raw: string): string {
  return createHash('sha256')
    .update(`${path}\n${normalizeComment(raw)}`)
    .digest('hex')
}

function walk(dir: string, files: string[]): void {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || skipDirs.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path, files)
    else if (entry.isFile() && entry.name !== 'next-env.d.ts' && sourceExt.test(entry.name)) {
      files.push(path)
    }
  }
}

export function sourceFiles(repoRoot: string): string[] {
  const files: string[] = []
  walk(join(repoRoot, 'apps'), files)
  walk(join(repoRoot, 'libs'), files)
  files.sort()
  return files
}

export function fingerprintsIn(repoRoot: string): { path: string; raw: string; hash: string }[] {
  const found: { path: string; raw: string; hash: string }[] = []
  for (const file of sourceFiles(repoRoot)) {
    const path = relative(repoRoot, file).split('\\').join('/')
    const source = readFileSync(file, 'utf8')
    for (const raw of proseComments(source)) {
      found.push({ path, raw, hash: commentFingerprint(path, raw) })
    }
  }
  return found
}

export function readBaseline(text: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const line of text.split('\n')) {
    const hash = line.trim()
    if (hash.length === 0) continue
    counts.set(hash, (counts.get(hash) ?? 0) + 1)
  }
  return counts
}

export function newCommentFailures(
  comments: readonly { path: string; raw: string; hash: string }[],
  baseline: ReadonlyMap<string, number>,
): string[] {
  const left = new Map(baseline)
  const failures: string[] = []
  for (const comment of comments) {
    const count = left.get(comment.hash) ?? 0
    if (count > 0) {
      left.set(comment.hash, count - 1)
      continue
    }
    const text = normalizeComment(comment.raw).slice(0, 80)
    failures.push(`${comment.path}: new comment: ${text}`)
  }
  return failures
}

export function commentRatchetFailures(repoRoot = root): string[] {
  const baseline = readBaseline(existsSync(baselinePath) ? readFileSync(baselinePath, 'utf8') : '')
  return newCommentFailures(fingerprintsIn(repoRoot), baseline)
}

export function assertCommentSelfTest(): void {
  const source = [
    'const url = "https://example.com"',
    'const pattern = /[&<>"]/g',
    '/** kept out of the string */',
    'const html = `<b>${1 /* inside */}</b>`',
    '// eslint-disable-next-line no-console',
  ].join('\n')
  const comments = proseComments(source)
  if (
    comments.length !== 2 ||
    !comments[0]?.includes('kept out') ||
    !comments[1]?.includes('inside')
  ) {
    throw new Error('self-test failed: comment scan')
  }
  const baseline = readBaseline(`${commentFingerprint('a.ts', comments[0] ?? '')}\n`)
  const failures = newCommentFailures(
    [
      { path: 'a.ts', raw: comments[0] ?? '', hash: commentFingerprint('a.ts', comments[0] ?? '') },
      { path: 'a.ts', raw: comments[1] ?? '', hash: commentFingerprint('a.ts', comments[1] ?? '') },
    ],
    baseline,
  )
  if (failures.length !== 1 || !failures[0]?.includes('inside')) {
    throw new Error('self-test failed: comment ratchet')
  }
}

function isEntry(): boolean {
  const entry = process.argv[1]
  return entry !== undefined && fileURLToPath(import.meta.url) === resolve(entry)
}

if (isEntry()) {
  const comments = fingerprintsIn(root)
  if (process.argv.includes('--print')) {
    process.stdout.write(`${comments.map((comment) => comment.hash).join('\n')}\n`)
  } else {
    const failures = commentRatchetFailures()
    if (failures.length === 0) {
      console.log(`comments: ok (${comments.length})`)
    } else {
      console.log('comments: failed')
      for (const failure of failures) console.log(`- ${failure}`)
      process.exitCode = 1
    }
  }
}
