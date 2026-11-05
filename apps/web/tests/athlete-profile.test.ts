import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { tennisPercentages } from '@cro-sport-hub/shared-types'
import { expect, test } from 'vite-plus/test'
import AthletePage, { generateMetadata } from '../app/athletes/[slug]/page'
import { athletePath } from '../lib/api-client'
import { AthleteUnavailableMain } from '../lib/athlete-view'

const karlo = {
  slug: 'karlo-brkic',
  name: 'Karlo Brkić',
  sport: 'football' as const,
  country: 'HR',
  position: 'Forward',
  clubs: [
    { name: 'Sample Home', from: '2025-07-01' },
    { name: 'Sample Town', from: '2023-07-01', to: '2025-06-30' },
  ],
  results: [
    {
      id: 'match-sample-league',
      competition: 'Sample League',
      date: '2026-10-19',
      round: 'Matchday 8',
      club: 'Sample Home',
      started: true,
      minutes: 90,
      goals: 2,
      assists: 0,
      yellowCards: 0,
      redCard: false,
    },
  ],
}

const playerAStats = {
  aces: 3,
  doubleFaults: 1,
  firstServeIn: 6,
  firstServeTotal: 10,
  firstServePointsWon: 4,
  secondServePointsWon: 2,
  secondServeTotal: 4,
  breakPointsSaved: 1,
  breakPointsFaced: 2,
  breakPointsWon: 2,
  breakPointsTotal: 4,
  totalPointsWon: 20,
}

const playerA = {
  slug: 'sample-player-a',
  name: 'Sample Player A',
  sport: 'tennis' as const,
  country: 'HR',
  clubs: [],
  results: [
    {
      id: 'match-sample-final',
      competition: 'Sample Cup',
      date: '2026-10-18',
      round: 'Final',
      opponent: 'Sample Player B',
      winner: 'athlete' as const,
      bestOf: 3,
      score: [
        [6, 4],
        [7, 6, 5],
      ],
      retired: false,
      ...playerAStats,
      percentages: tennisPercentages(playerAStats),
    },
  ],
}

const nullPctStats = {
  aces: 0,
  doubleFaults: 0,
  firstServeIn: 0,
  firstServeTotal: 4,
  firstServePointsWon: 0,
  secondServePointsWon: 0,
  secondServeTotal: 4,
  breakPointsSaved: 0,
  breakPointsFaced: 0,
  breakPointsWon: 0,
  breakPointsTotal: 0,
  totalPointsWon: 0,
}

function statsRow(html: string, label: string): string {
  const found = html
    .split('<tr>')
    .slice(1)
    .find((part) => part.includes(`>${label}`))
  if (found === undefined) throw new Error(`Missing row ${label}`)
  return found
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

async function renderAthlete(
  slug: string,
  respond: (path: string) => Response | Promise<Response>,
): Promise<{ html: string; urls: string[] }> {
  const previous = globalThis.fetch
  const urls: string[] = []
  globalThis.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    urls.push(url)
    const path = new URL(url).pathname
    return respond(path)
  }
  try {
    const html = renderToStaticMarkup(await AthletePage({ params: Promise.resolve({ slug }) }))
    return { html, urls }
  } finally {
    globalThis.fetch = previous
  }
}

test('tennis profile shows the header, no clubs, and the published final', async () => {
  const { html, urls } = await renderAthlete('sample-player-a', (path) => {
    if (path === athletePath('sample-player-a')) return json(playerA)
    throw new Error(`unexpected ${path}`)
  })

  expect(urls).toEqual([`http://localhost:3001${athletePath('sample-player-a')}`])
  expect(html).toContain('Sample Player A')
  expect(html).toContain('No clubs.')
  expect(html).toContain('Sample Player A versus Sample Player B')
  expect(html).toContain('Winner')
  expect(html).toContain('<sup aria-hidden="true">5</sup>')
  expect(html).not.toContain('Quarterfinal')
  expect(html).not.toContain('club-sample')
  expect(html).not.toContain('sample-home')
  expect(statsRow(html, 'First serve')).toContain('>60%</td>')
})

test('a null tennis percentage reads as no attempts on the athlete page', async () => {
  const profile = {
    ...playerA,
    results: [
      {
        id: 'match-null-pct',
        competition: 'Sample Cup',
        date: '2026-10-10',
        round: 'R1',
        opponent: 'Sample Player B',
        winner: 'athlete' as const,
        bestOf: 3,
        score: [
          [6, 4],
          [6, 3],
        ],
        retired: false,
        ...nullPctStats,
        percentages: tennisPercentages(nullPctStats),
      },
    ],
  }
  const { html } = await renderAthlete('sample-player-a', (path) => {
    if (path === athletePath('sample-player-a')) return json(profile)
    throw new Error(`unexpected ${path}`)
  })

  expect(statsRow(html, 'First-serve points won')).toContain('>No attempts</td>')
  expect(statsRow(html, 'First-serve points won')).not.toContain('>0%</td>')
})

test('football profile lists club names without ids or a tennis scoreboard', async () => {
  const { html } = await renderAthlete('karlo-brkic', (path) => {
    if (path === athletePath('karlo-brkic')) return json(karlo)
    throw new Error(`unexpected ${path}`)
  })

  expect(html).toContain('Karlo Brkić')
  expect(html).toContain('Sample Home')
  expect(html).toContain('Sample Town')
  expect(html).toContain('2025-07-01')
  expect(html).toContain('2023-07-01')
  expect(html).not.toContain('club-sample')
  expect(html).not.toContain('sample-town')
  expect(html).not.toContain('versus')
  expect(html).not.toContain('Set 1')
})

test('an unknown slug triggers not found', async () => {
  await expect(
    renderAthlete('nobody', (path) => {
      if (path === athletePath('nobody')) return json({ message: 'Unknown athlete' }, 404)
      throw new Error(`unexpected ${path}`)
    }),
  ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/)
})

test('a failed profile fetch renders unavailable copy', async () => {
  const { html } = await renderAthlete('sample-player-a', () => {
    throw new Error('down')
  })

  expect(html).toContain('This athlete is unavailable.')
})

test('unavailable main keeps the shared heading', () => {
  const html = renderToStaticMarkup(createElement(AthleteUnavailableMain))
  expect(html).toContain('<h1>Cro Sport Hub</h1>')
})

test('document title is the athlete name', async () => {
  const previous = globalThis.fetch
  globalThis.fetch = async () => json(playerA)
  try {
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: 'sample-player-a' }) }),
    ).resolves.toEqual({
      title: 'Sample Player A · Cro Sport Hub',
    })
  } finally {
    globalThis.fetch = previous
  }
})
