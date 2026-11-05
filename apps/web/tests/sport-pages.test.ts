import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import FootballPage, { metadata as footballMetadata } from '../app/football/page'
import TennisPage, { metadata as tennisMetadata } from '../app/tennis/page'
import { footballMatchesPath, tennisMatchesPath } from '../lib/api-client'

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
  respond: () => Response | Promise<Response>,
): Promise<{ html: string; urls: string[] }> {
  const previous = globalThis.fetch
  const urls: string[] = []
  globalThis.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    urls.push(url)
    return respond()
  }
  try {
    return { html: renderToStaticMarkup(await Page()), urls }
  } finally {
    globalThis.fetch = previous
  }
}

test('tennis lists only tennis cards from its endpoint', async () => {
  const { html, urls } = await renderSportPage(TennisPage, () => json(publishedPage([final])))

  expect(urls).toEqual([`http://localhost:3001${tennisMatchesPath}`])
  expect(html).toContain('Sample Player A')
  expect(html).toContain('Sample Player B')
  expect(html).not.toContain('Sample Home')
  expect(html).not.toContain('Sample Away')
})

test('football lists only football cards from its endpoint', async () => {
  const { html, urls } = await renderSportPage(FootballPage, () => json(publishedPage([league])))

  expect(urls).toEqual([`http://localhost:3001${footballMatchesPath}`])
  expect(html).toContain('Sample Home')
  expect(html).toContain('Sample Away')
  expect(html).not.toContain('Sample Player A')
  expect(html).not.toContain('Sample Player B')
})

test('a rejected fetch on football still renders the heading', async () => {
  const { html } = await renderSportPage(FootballPage, () => {
    throw new Error('down')
  })

  expect(html).toContain('<h1>Cro Sport Hub</h1>')
  expect(html).toContain('Results are unavailable.')
})

test('sport document titles name the sport and set no share image', () => {
  expect(tennisMetadata.title).toBe('Tennis results · Cro Sport Hub')
  expect(tennisMetadata.description).toBe('Latest tennis results.')
  expect(tennisMetadata.openGraph).toBeUndefined()
  expect(JSON.stringify(tennisMetadata)).not.toContain('og:image')

  expect(footballMetadata.title).toBe('Football results · Cro Sport Hub')
  expect(footballMetadata.description).toBe('Latest football results.')
  expect(footballMetadata.openGraph).toBeUndefined()
  expect(JSON.stringify(footballMetadata)).not.toContain('og:image')
})
