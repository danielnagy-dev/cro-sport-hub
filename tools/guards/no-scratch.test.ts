import { expect, test } from 'vite-plus/test'
import { mentionFailures, mentionNeedle, trackedScratchPaths } from './no-scratch.ts'

test('trackedScratchPaths finds the tree root, nested files, and plan index paths', () => {
  expect(
    trackedScratchPaths([
      'apps/a.ts',
      '.scratch/plan-index.md',
      'docs/agents/plan-index.md',
      '.scratch',
    ]),
  ).toEqual(['.scratch', '.scratch/plan-index.md', 'docs/agents/plan-index.md'])
})

test('mentionFailures skips the guard sources and flags other paths', () => {
  const readText = (path: string) =>
    path === 'docs/agents/issue-tracker.md' ? `See ${mentionNeedle}plan-index.md` : ''
  expect(
    mentionFailures(['tools/guards/no-scratch.ts', 'docs/agents/issue-tracker.md'], readText),
  ).toEqual([`docs/agents/issue-tracker.md:1: mentions ${mentionNeedle}`])
})
