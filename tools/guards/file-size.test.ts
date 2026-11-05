import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vite-plus/test'
import {
  failureMessage,
  failuresFor,
  ignored,
  loadConfig,
  over,
  stagedBytes,
  tokens,
} from './file-size.ts'

const config = loadConfig()

test('token estimate blocks over limit and allows at limit', () => {
  expect(tokens(20_000)).toBe(5000)
  expect(tokens(20_004)).toBe(5001)
  expect(over(20_000)).toBe(false)
  expect(over(20_001)).toBe(true)
})

test('ignored paths skip lockfiles, catalog SQL, design assets, and generated dirs', () => {
  expect(ignored('pnpm-lock.yaml', config)).toBe(true)
  expect(ignored('dir/foo.lock', config)).toBe(true)
  expect(ignored('apps/api/src/catalog/0005_v1_credentials.sql', config)).toBe(true)
  expect(ignored('libs/slide-generator/design/football-r13/fonts/Archivo.ttf', config)).toBe(true)
  expect(ignored('.agents/skills/tdd/SKILL.md', config)).toBe(true)
  expect(ignored('artifacts/verify/openapi.json', config)).toBe(true)
  expect(ignored('apps/web/.next/server.js', config)).toBe(true)
  expect(ignored('apps/api/src/ok.ts', config)).toBe(false)
})

test('failuresFor reports only non-ignored files over the limit', () => {
  const files = [
    { path: 'pnpm-lock.yaml', bytes: 400_000 },
    { path: 'apps/api/src/ok.ts', bytes: 20_000 },
    { path: 'apps/api/src/big.ts', bytes: 20_004 },
    { path: 'tools/verify/verify.ts', bytes: 40_000 },
  ]
  const hits = failuresFor(files, new Set(), config)
  expect(hits).toEqual([failureMessage('apps/api/src/big.ts', 20_004)])
})

test('failure message names path, tokens, limit, and split instructions', () => {
  expect(failureMessage('apps/api/src/big.ts', 20_004)).toBe(
    'apps/api/src/big.ts: 5001 estimated tokens (bytes/4), limit 5000. Split by responsibility into smaller modules (e.g. one component/service/route per file, move helpers and types out, move fixtures/test data to separate files), keep each file under the limit, then re-stage.',
  )
})

test('staged bytes come from the index, not the working tree', () => {
  const dir = mkdtempSync(join(tmpdir(), 'file-size-staged-'))
  execFileSync('git', ['init', '-q'], { cwd: dir })
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir })
  execFileSync('git', ['config', 'user.name', 'test'], { cwd: dir })
  const rel = 'big.ts'
  writeFileSync(join(dir, rel), 'a'.repeat(20_004))
  execFileSync('git', ['add', rel], { cwd: dir })
  appendFileSync(join(dir, rel), 'b'.repeat(10_000))
  expect(stagedBytes(rel, dir)).toBe(20_004)
  expect(over(stagedBytes(rel, dir) ?? 0)).toBe(true)
})
