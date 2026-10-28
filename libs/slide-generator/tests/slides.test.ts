import { expect, test } from 'vite-plus/test'
import {
  footballRendererReason,
  footballSlides,
  footballTemplate,
  renderFootballPngs,
  type FootballEntry,
} from '../src/index.ts'

function entry(
  name: string,
  competition: string,
  round = '9. kolo',
  date = '18. 10.',
): FootballEntry {
  return {
    competition,
    round,
    date,
    player: {
      name,
      club: 'Sample Club',
      number: 1,
      position: 'vezni',
      fixture: {
        home: 'Sample Home',
        away: 'Sample Away',
        homeScore: 1,
        awayScore: 0,
        side: 'home',
      },
      stats: [{ key: 'minutes', label: 'Minute', value: '90’' }],
    },
  }
}

const handoff: readonly FootballEntry[] = [
  entry('Karlo Brkić', 'SuperSport HNL', '10. kolo', '18. 10.'),
  entry('Filip Šarić', 'Serie A'),
  entry('Mateo Jurčić', 'Serie A'),
  entry('Leon Vuković', 'Serie A'),
  entry('Bruno Perić', 'Serie A'),
]

test('an empty set of appearances is no slides', () => {
  expect(footballSlides([])).toEqual([])
})

test('six appearances in one round stay one list', () => {
  const slides = footballSlides(
    Array.from({ length: 6 }, (_, index) => entry(`Sample Row ${index + 1}`, 'Sample League')),
  )
  expect(slides).toHaveLength(1)
  const slide = slides[0]
  expect(slide?.kind).toBe('list')
  if (slide?.kind !== 'list') return
  expect(slide.players.map((player) => player.name)).toEqual([
    'Sample Row 1',
    'Sample Row 2',
    'Sample Row 3',
    'Sample Row 4',
    'Sample Row 5',
    'Sample Row 6',
  ])
  expect(footballTemplate(slide).zoom).toBe(1.15)
})

test('a seventh appearance overflows onto a second list', () => {
  const rows = Array.from({ length: 7 }, (_, index) =>
    entry(`Sample Row ${index + 1}`, 'Sample League', '10. kolo'),
  )
  expect(() =>
    footballTemplate({
      kind: 'list',
      competition: 'Sample League',
      round: '10. kolo',
      date: '18. 10.',
      players: rows.map((row) => row.player),
    }),
  ).toThrow('at most 6')
  const slides = footballSlides(rows)
  expect(slides.map((slide) => (slide.kind === 'list' ? slide.players.length : 0))).toEqual([6, 1])
  expect(slides.every((slide) => slide.kind === 'list')).toBe(true)
  const overflow = slides[1]
  expect(overflow?.kind === 'list' ? overflow.players[0]?.name : undefined).toBe('Sample Row 7')
  for (const slide of slides) footballTemplate(slide)
})

test('the handoff sample is a player slide then the Serie A list', () => {
  const slides = footballSlides(handoff)
  expect(slides.map((slide) => slide.kind)).toEqual(['player', 'list'])
  const player = slides[0]
  const list = slides[1]
  expect(player?.kind === 'player' ? player.player.name : undefined).toBe('Karlo Brkić')
  expect(player?.kind === 'player' ? player.competition : undefined).toBe('SuperSport HNL')
  expect(list?.kind === 'list' ? list.players.map((person) => person.name) : []).toEqual([
    'Filip Šarić',
    'Mateo Jurčić',
    'Leon Vuković',
    'Bruno Perić',
  ])
})

test('rendering no slides does not need Chromium', async () => {
  await expect(renderFootballPngs([])).resolves.toEqual([])
})

function pngSize(bytes: Uint8Array): { width: number; height: number } {
  expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

test('each handoff slide renders as a 1080×1350 PNG', async ({ skip }) => {
  const reason = footballRendererReason()
  if (reason !== undefined) skip(reason)
  const pngs = await renderFootballPngs(footballSlides(handoff))
  expect(pngs).toHaveLength(2)
  for (const png of pngs) expect(pngSize(png)).toEqual({ width: 1080, height: 1350 })
})
