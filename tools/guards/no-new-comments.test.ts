import { expect, test } from 'vite-plus/test'
import {
  commentFingerprint,
  commentRatchetFailures,
  newCommentFailures,
  proseComments,
  readBaseline,
} from './no-new-comments.ts'

test('a triple-slash reference is a directive', () => {
  expect(proseComments('/// <reference types="next" />\n')).toEqual([])
})

test('scanner ignores strings and keeps a comment after a quote in a regex', () => {
  const comments = proseComments(
    'const pattern = /[&<>"]/g\n/** after */\nconst url = "https://example.com"\n',
  )
  expect(comments).toEqual(['/** after */'])
})

test('a baselined comment passes and a new one fails', () => {
  const raw = '/** hello */'
  const hash = commentFingerprint('apps/a.ts', raw)
  const failures = newCommentFailures(
    [
      { path: 'apps/a.ts', raw, hash },
      { path: 'apps/a.ts', raw: '// extra', hash: commentFingerprint('apps/a.ts', '// extra') },
    ],
    readBaseline(`${hash}\n`),
  )
  expect(failures).toEqual(['apps/a.ts: new comment: extra'])
})

test('removing a baselined comment does not fail', () => {
  const raw = '/** hello */'
  const hash = commentFingerprint('apps/a.ts', raw)
  expect(newCommentFailures([], readBaseline(`${hash}\n`))).toEqual([])
})

test('the repo has no new comments', () => {
  expect(commentRatchetFailures()).toEqual([])
})
