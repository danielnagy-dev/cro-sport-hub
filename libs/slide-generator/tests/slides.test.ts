import { expect, test } from 'vite-plus/test'
import { chromium } from '@playwright/test'
import {
  embedFontsInFootballHtml,
  footballRendererReason,
  footballSlides,
  footballTemplate,
  renderFootballPngs,
  type FootballEntry,
  type FootballSlide,
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
      stats: [{ key: 'minutes', label: 'MINUTE', value: '90’' }],
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

test('four appearances in one round stay one list', () => {
  const slides = footballSlides(
    Array.from({ length: 4 }, (_, index) => entry(`Sample Row ${index + 1}`, 'Sample League')),
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
  ])
  expect(footballTemplate(slide).zoom).toBe(1.15)
})

test('a fifth appearance overflows onto a second slide', () => {
  const rows = Array.from({ length: 5 }, (_, index) =>
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
  ).toThrow('at most 4')
  const slides = footballSlides(rows)
  expect(slides.map((slide) => slide.kind)).toEqual(['list', 'list'])
  expect(slides[0]?.kind === 'list' ? slides[0].players.length : 0).toBe(4)
  const tail = slides[1]
  expect(tail?.kind).toBe('list')
  expect(tail?.kind === 'list' ? tail.players[0]?.name : undefined).toBe('Sample Row 5')
  for (const slide of slides) footballTemplate(slide)
})

const LIST_SAMPLE_PLAYERS: FootballEntry['player'][] = [
  {
    name: 'Filip Šarić',
    club: 'Como',
    number: 17,
    position: 'desni bek',
    lineup: 'start',
    fixture: { home: 'Fiorentina', away: 'Como', homeScore: 1, awayScore: 3, side: 'away' },
    stats: [
      { key: 'minutes', label: 'MINUTE', value: '90’' },
      { key: 'assists', label: 'ASIST.', value: '1' },
      { key: 'key_passes', label: 'Ključna dodavanja', value: '3' },
      { key: 'passes', label: 'Dodavanja', accurate: 38, total: 45 },
      { key: 'shots', label: 'Udarci', value: '1' },
      { key: 'yellow', label: 'Žuti karton', value: '1' },
    ],
  },
  {
    name: 'Mateo Jurčić',
    club: 'Lazio',
    number: 6,
    position: 'branič',
    lineup: 'start',
    fixture: { home: 'Juventus', away: 'Lazio', homeScore: 1, awayScore: 1, side: 'away' },
    stats: [
      { key: 'minutes', label: 'MINUTE', value: '90’' },
      { key: 'passes', label: 'Dodavanja', accurate: 46, total: 50 },
      { key: 'yellow', label: 'Žuti karton', value: '1' },
    ],
  },
  {
    name: 'Leon Vuković',
    club: 'Milan',
    number: 14,
    position: 'vezni',
    lineup: 'start',
    fixture: { home: 'Milan', away: 'Atalanta', homeScore: 3, awayScore: 2, side: 'home' },
    stats: [
      { key: 'minutes', label: 'MINUTE', value: '90’' },
      { key: 'goals', label: 'GOLOVI', value: '1' },
      { key: 'assists', label: 'ASIST.', value: '1' },
      { key: 'shots', label: 'Udarci', value: '3', onTarget: '2' },
      { key: 'key_passes', label: 'Ključna dodavanja', value: '4' },
      { key: 'passes', label: 'Dodavanja', accurate: 67, total: 72 },
      { key: 'yellow', label: 'Žuti karton', value: '1' },
    ],
  },
  {
    name: 'Bruno Perić',
    club: 'Atalanta',
    number: 8,
    position: 'vezni',
    lineup: 'sub',
    fixture: { home: 'Milan', away: 'Atalanta', homeScore: 3, awayScore: 2, side: 'away' },
    stats: [
      { key: 'minutes', label: 'MINUTE', value: '32’' },
      { key: 'goals', label: 'GOLOVI', value: '1' },
      { key: 'shots', label: 'Udarci', value: '2' },
      { key: 'passes', label: 'Dodavanja', accurate: 16, total: 20 },
    ],
  },
  {
    name: 'Luka Modrić',
    club: 'Real Madrid',
    number: 10,
    position: 'vezni',
    lineup: 'start',
    fixture: { home: 'Osasuna', away: 'Real Madrid', homeScore: 0, awayScore: 2, side: 'away' },
    stats: [
      { key: 'minutes', label: 'MINUTE', value: '90’' },
      { key: 'passes', label: 'Dodavanja', accurate: 58, total: 64 },
      { key: 'key_passes', label: 'Ključna dodavanja', value: '2' },
    ],
  },
]

async function assertListRowsStayAboveFooter(
  slide: Extract<FootballSlide, { kind: 'list' }>,
  caption: string | undefined,
): Promise<void> {
  const doc = footballTemplate({ ...slide, caption })
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({
      viewport: { width: 1080, height: 1350 },
      deviceScaleFactor: 1,
    })
    await page.setContent(embedFontsInFootballHtml(doc.html), { waitUntil: 'load' })
    const facesReady = await page.evaluate<boolean>(
      "document.fonts.ready.then(function () { return document.fonts.check('900 192px BS') && document.fonts.check('700 20px AR'); })",
    )
    if (!facesReady) throw new Error('The round-13 fonts did not load')
    const limit = await page.evaluate<number, string>((captionText) => {
      const content = document.querySelector('.content')
      const brand = document.querySelector('.brand')
      const rows = [...document.querySelectorAll<HTMLElement>('.row')]
      if (content === null || brand === null) throw new Error('Missing layout root')
      const footerTop = brand.getBoundingClientRect().top
      let yMax: number = footerTop
      if (captionText) {
        const caps = [...document.querySelectorAll<HTMLElement>('.content > p.match.player')]
        const cap = caps.find((element) => element.textContent === captionText)
        if (cap === undefined) throw new Error('Missing caption node')
        const capTop = cap.getBoundingClientRect().top
        yMax = Math.min(yMax, capTop)
      }
      let worst = 0
      for (const row of rows) {
        const bottom = row.getBoundingClientRect().bottom
        if (bottom > worst) worst = bottom
      }
      return yMax - worst
    }, caption ?? '')
    expect(limit).toBeGreaterThan(0)
  } finally {
    await browser.close()
  }
}

test('five list appearances stay above the footer in the layout (Chromium)', async ({ skip }) => {
  const reason = footballRendererReason()
  if (reason !== undefined) skip(reason)
  const five = LIST_SAMPLE_PLAYERS.slice(0, 5).map((player, index) => ({
    competition: 'Serie A',
    round: '9. kolo',
    date: '18. 10.',
    player: { ...player, name: `${player.name} ${index + 1}` },
  }))
  const slides = footballSlides(five)
  expect(slides.map((slide) => slide.kind)).toEqual(['list', 'list'])
  for (const slide of slides) {
    if (slide.kind !== 'list') continue
    await assertListRowsStayAboveFooter(slide, undefined)
  }
})

test('eight list appearances stay above the footer across paginated slides (Chromium)', async ({
  skip,
}) => {
  const reason = footballRendererReason()
  if (reason !== undefined) skip(reason)
  const eight = Array.from({ length: 8 }, (_, index) => {
    const base = LIST_SAMPLE_PLAYERS[index % 4]
    if (base === undefined) throw new Error('missing list sample player')
    return {
      ...base,
      name: `${base.name} ${index + 1}`,
    }
  })
  const slides = footballSlides(
    eight.map((player) => ({
      competition: 'Serie A',
      round: '9. kolo',
      date: '18. 10.',
      player,
    })),
  )
  expect(slides.map((slide) => slide.kind)).toEqual(['list', 'list'])
  for (const slide of slides) {
    if (slide.kind !== 'list') continue
    await assertListRowsStayAboveFooter(slide, undefined)
  }
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
