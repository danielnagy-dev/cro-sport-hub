import { expect, test } from 'vite-plus/test'
import { parseClosingIssueNumbers } from './close-linked-issues.ts'

test('parses closing keywords case-insensitively', () => {
  expect(parseClosingIssueNumbers('FIXes #42 and Closes #7\nresolve #99')).toEqual([42, 7, 99])
})

test('deduplicates issue numbers', () => {
  expect(parseClosingIssueNumbers('closes #1, closes #1')).toEqual([1])
})

test('ignores refs without a closing keyword', () => {
  expect(parseClosingIssueNumbers('See #12 and discussion in #34')).toEqual([])
})

test('ignores zero and invalid numbers from regex edge cases', () => {
  expect(parseClosingIssueNumbers('closes #0')).toEqual([])
})
