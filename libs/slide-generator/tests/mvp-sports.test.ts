import { expect, test } from 'vite-plus/test'
import {
  slidesFromAppearance,
  type AppearanceSlideInput,
  type AppearanceSlidePayload,
} from '../src/index.ts'

const solo: AppearanceSlideInput = {
  athleteName: 'Sample Player A',
  clubName: 'Sample Club',
  competition: 'Sample Cup',
  round: 'Final',
  date: '2026-11-08',
  homeTeam: 'Sample Club',
  awayTeam: 'Sample Rival',
  homeGoals: 2,
  awayGoals: 0,
  side: 'home',
  started: true,
  minutes: 90,
  goals: 2,
  assists: 1,
  yellowCards: 0,
  redCard: false,
}

function payload(
  sportSlug: AppearanceSlidePayload['sportSlug'],
  appearances: readonly AppearanceSlideInput[] = [solo],
): AppearanceSlidePayload {
  return { sportSlug, appearances }
}

test('slidesFromAppearance dispatches tennis to the MVP tennis template', () => {
  const docs = slidesFromAppearance(payload('tennis'))
  expect(docs).toHaveLength(1)
  expect(docs[0]).toMatchObject({
    width: 1080,
    height: 1350,
    sportSlug: 'tennis',
  })
  expect(docs[0]?.html).toContain('Sample Player A')
  expect(docs[0]?.html).toContain('Tennis')
  expect(docs[0]?.html).toContain('1080px')
  expect(docs[0]?.html).toContain('1350px')
})

test('slidesFromAppearance dispatches basketball to the MVP basketball template', () => {
  const docs = slidesFromAppearance(payload('basketball'))
  expect(docs).toHaveLength(1)
  expect(docs[0]).toMatchObject({
    width: 1080,
    height: 1350,
    sportSlug: 'basketball',
  })
  expect(docs[0]?.html).toContain('Sample Player A')
  expect(docs[0]?.html).toContain('Basketball')
  expect(docs[0]?.html).toContain('1080px')
  expect(docs[0]?.html).toContain('1350px')
})

test('slidesFromAppearance keeps football on the round-13 template', () => {
  const docs = slidesFromAppearance(payload('football'))
  expect(docs).toHaveLength(1)
  expect(docs[0]).toMatchObject({
    width: 1080,
    height: 1350,
    sportSlug: 'football',
    kind: 'player',
    designRound: '13-interim',
  })
  expect(docs[0]?.html).toContain('Sample Player')
  expect(docs[0]?.html).toContain('data-design="13-interim"')
  expect(docs[0]?.html).not.toContain('data-mvp="placeholder"')
})

test('slidesFromAppearance rejects an unknown sportSlug', () => {
  expect(() =>
    slidesFromAppearance({
      sportSlug: 'handball',
      appearances: [solo],
    } as unknown as AppearanceSlidePayload),
  ).toThrow(/Unknown sport: handball/)
})

test('tennis and basketball MVP templates emit one slide per appearance', () => {
  const rows = [solo, { ...solo, athleteName: 'Sample Player B' }]
  expect(slidesFromAppearance(payload('tennis', rows))).toHaveLength(2)
  expect(slidesFromAppearance(payload('basketball', rows))).toHaveLength(2)
})
