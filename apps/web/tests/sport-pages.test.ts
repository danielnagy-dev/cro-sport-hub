import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import FootballPage, { metadata as footballMetadata } from '../app/football/page'
import TennisPage, { metadata as tennisMetadata } from '../app/tennis/page'
import { athletesBySportPath, footballMatchesPath, tennisMatchesPath } from '../lib/api-client'
import { SITE_NAME } from '../lib/site-metadata'

const league = {
  id: 'match-sample-league',
  sport: 'football' as const,
  competition: 'Sample League',
  date: '2026-10-19',
  round: 'Matchday 8',
  homeTeam: 'Sample Home',
  awayTeam: 'Sample Away',
  homeGoals: 2,
  awayGoals: 1,
}
const final = {
  id: 'match-sample-final',
  sport: 'tennis' as const,
  competition: 'Sample Cup',
  date: '2026-10-18',
  round: 'Final',
  playerA: 'Sample Player A',
  playerB: 'Sample Player B',
  winner: 'a' as const,
  bestOf: 3 as const,
  score: [
    [6, 4],
    [7, 6, 5],
  ],
  retired: false,
}

function publishedPage(items: readonly unknown[]) {
  return { items, limit: 20, offset: 0, total: items.length }
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 })
}

async function renderSportPage(
  Page: typeof TennisPage,
  routes: Record<string, () => Response | Promise<Response>>,
): Promise<{ html: string; urls: string[] }> {
  const previous = globalThis.fetch
  const urls: string[] = []
  globalThis.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    urls.push(url)
    const path = `${new URL(url).pathname}${new URL(url).search}`
    const respond = routes[path]
    if (respond === undefined) throw new Error(`unexpected ${url}`)
    return respond()
  }
  try {
    return { html: renderToStaticMarkup(await Page()), urls }
  } finally {
    globalThis.fetch = previous
  }
}

const tennisAthletes = [{ slug: 'sample-player-a', name: 'Sample Player A' }]
const footballAthletes = [{ slug: 'karlo-brkic', name: 'Karlo Brkić' }]

test('tennis lists only tennis cards from its endpoint', async () => {
  const { html, urls } = await renderSportPage(TennisPage, {
    [tennisMatchesPath]: () => json(publishedPage([final])),
    [athletesBySportPath('tennis')]: () => json(tennisAthletes),
  })

  expect(urls).toEqual([
    `http://localhost:3001${tennisMatchesPath}`,
    `http://localhost:3001${athletesBySportPath('tennis')}`,
  ])
  expect(html).toContain('Sample Player A')
  expect(html).toContain('Sample Player B')
  expect(html).not.toContain('Sample Home')
  expect(html).not.toContain('Sample Away')
  expect(html).toContain('href="/athletes/sample-player-a"')
  expect(html).not.toContain('href="/athletes/karlo-brkic"')
})

test('football lists only football cards from its endpoint', async () => {
  const { html, urls } = await renderSportPage(FootballPage, {
    [footballMatchesPath]: () => json(publishedPage([league])),
    [athletesBySportPath('football')]: () => json(footballAthletes),
  })

  expect(urls).toEqual([
    `http://localhost:3001${footballMatchesPath}`,
    `http://localhost:3001${athletesBySportPath('football')}`,
  ])
  expect(html).toContain('Sample Home')
  expect(html).toContain('Sample Away')
  expect(html).not.toContain('Sample Player A')
  expect(html).not.toContain('Sample Player B')
  expect(html).toContain('href="/athletes/karlo-brkic"')
  expect(html).not.toContain('href="/athletes/sample-player-a"')
})

test('a rejected fetch on football still renders the heading', async () => {
  const { html } = await renderSportPage(FootballPage, {
    [footballMatchesPath]: () => {
      throw new Error('down')
    },
    [athletesBySportPath('football')]: () => json(footballAthletes),
  })

  expect(html).toContain('<h1>Cro Sport Hub</h1>')
  expect(html).toContain('Results are unavailable.')
})

test('a rejected athlete list still renders match cards', async () => {
  const { html } = await renderSportPage(TennisPage, {
    [tennisMatchesPath]: () => json(publishedPage([final])),
    [athletesBySportPath('tennis')]: () => {
      throw new Error('down')
    },
  })

  expect(html).toContain('Sample Player A')
  expect(html).not.toContain('href="/athletes/sample-player-a"')
})

test('sport document titles name the sport and Open Graph uses each sport path', () => {
  expect(tennisMetadata.title).toBe('Tennis results · Cro Sport Hub')
  expect(tennisMetadata.description).toBe('Latest tennis results.')
  expect(tennisMetadata.openGraph).toEqual({
    title: 'Tennis results · Cro Sport Hub',
    description: 'Latest tennis results.',
    type: 'website',
    url: 'http://localhost:3000/tennis',
    siteName: SITE_NAME,
  })
  expect(tennisMetadata.twitter).toEqual({
    card: 'summary',
    title: 'Tennis results · Cro Sport Hub',
    description: 'Latest tennis results.',
  })
  expect(JSON.stringify(tennisMetadata)).not.toContain('og:image')

  expect(footballMetadata.title).toBe('Football results · Cro Sport Hub')
  expect(footballMetadata.description).toBe('Latest football results.')
  expect(footballMetadata.openGraph).toEqual({
    title: 'Football results · Cro Sport Hub',
    description: 'Latest football results.',
    type: 'website',
    url: 'http://localhost:3000/football',
    siteName: SITE_NAME,
  })
  expect(footballMetadata.twitter).toEqual({
    card: 'summary',
    title: 'Football results · Cro Sport Hub',
    description: 'Latest football results.',
  })
  expect(JSON.stringify(footballMetadata)).not.toContain('og:image')
})
