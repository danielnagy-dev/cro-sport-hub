import { expect, test } from 'vite-plus/test'
import {
  countFromNumstat,
  excludedFromCount,
  failureMessage,
  limit,
  overLimit,
  skillNamesFromLock,
} from './pr-size.ts'

const skills = skillNamesFromLock({
  skills: { tdd: {}, grilling: {} },
})

test('excludes lockfiles and vendored skill trees', () => {
  expect(excludedFromCount('pnpm-lock.yaml', skills)).toBe(true)
  expect(excludedFromCount('skills-lock.json', skills)).toBe(true)
  expect(excludedFromCount('.agents/skills/tdd/SKILL.md', skills)).toBe(true)
  expect(excludedFromCount('.agents/skills/THIRD_PARTY.md', skills)).toBe(false)
  expect(excludedFromCount('apps/api/src/foo.ts', skills)).toBe(false)
})

test('counts insertions plus deletions with exclusions', () => {
  const numstat = [
    '10\t5\tapps/api/src/a.ts',
    '100\t200\tpnpm-lock.yaml',
    '3\t7\t.agents/skills/tdd/SKILL.md',
    '2\t1\t.agents/skills/THIRD_PARTY.md',
    '-\t-\tbinary.png',
  ].join('\n')
  expect(countFromNumstat(numstat, skills)).toBe(18)
})

test('threshold at 500 counted lines', () => {
  expect(overLimit(500)).toBe(false)
  expect(overLimit(501)).toBe(true)
  expect(failureMessage(501)).toBe(
    `PR size: 501 counted lines (insertions plus deletions, with the plan skill exclusions), limit ${limit}. Split this PR.`,
  )
  expect(failureMessage(500)).toBeUndefined()
})
