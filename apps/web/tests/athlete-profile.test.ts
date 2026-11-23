import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import AthletePage, { generateMetadata } from '../app/athletes/[slug]/page'
import { publicAthletePath } from '../lib/api-client'
import {
  ATHLETE_UNAVAILABLE_COPY,
  AthleteUnavailableMain,
  CLUB_EMPTY_COPY,
} from '../lib/athlete-view'
import { HISTORY_EMPTY_COPY, UPCOMING_EMPTY_COPY } from '../lib/athlete-football-results'
import { SITE_NAME } from '../lib/site-metadata'

const historyRow = {
  id: 'appearance-sample-football',
  sportSlug: 'football' as const,
  competitionId: 'comp-sample-league',
  opponentLabel: 'Sample Away',
  startsAt: '2026-10-19T15:00:00+00:00',
  status: 'completed' as const,
  result: { score: '2-1' },
}

const karlo = {
  slug: 'karlo-brkic',
  name: 'Karlo Brkić',
  sport: 'football' as const,
  country: 'HR',
  position: 'Forward',
  clubName: 'Sample Home',
  history: [historyRow],
  upcoming: [
    {
      id: 'appearance-sample-upcoming',
      sportSlug: 'football' as const,
      competitionId: 'comp-sample-league',
      opponentLabel: 'Sample Rivals',
      startsAt: '2026-12-01T18:00:00+00:00',
      status: 'scheduled' as const,
    },
  ],
}

const playerA = {
  slug: 'sample-player-a',
  name: 'Sample Player A',
  sport: 'tennis' as const,
  country: 'HR',
  history: [
    {
      id: 'appearance-sample-tennis',
      sportSlug: 'tennis' as const,
      competitionId: 'comp-sample-cup',
      opponentLabel: 'Sample Player B',
      startsAt: '2026-10-18T12:00:00+00:00',
      status: 'completed' as const,
      result: { sets: '6-4 7-6' },
    },
  ],
  upcoming: [] as typeof karlo.upcoming,
}

const basketballer = {
  slug: 'sample-hooper',
  name: 'Sample Hooper',
  sport: 'basketball' as const,
  country: 'HR',
  clubName: 'Sample Club',
  history: [
    {
      id: 'appearance-sample-bball',
      sportSlug: 'basketball' as const,
      competitionId: 'comp-sample-bball',
      opponentLabel: 'Sample Visitors',
      startsAt: '2026-09-01T17:00:00+00:00',
      status: 'completed' as const,
      result: { score: '88-81' },
    },
  ],
  upcoming: [] as typeof karlo.upcoming,
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

test('football profile shows the header, club, history, and upcoming', async () => {
  const { html, urls } = await renderAthlete('karlo-brkic', (path) => {
    if (path === publicAthletePath('karlo-brkic')) return json(karlo)
    throw new Error(`unexpected ${path}`)
  })

  expect(urls).toEqual([`http://localhost:3001${publicAthletePath('karlo-brkic')}`])
  expect(html).toContain('Karlo Brkić')
  expect(html).toContain('Sample Home')
  expect(html).toContain('Sample Away')
  expect(html).toContain('Sample Rivals')
  expect(html).toContain('2-1')
  expect(html).not.toContain('versus')
  expect(html).not.toContain('appearances</caption>')
})

test('tennis profile lists editorial rows without scoreboard chrome', async () => {
  const { html } = await renderAthlete('sample-player-a', (path) => {
    if (path === publicAthletePath('sample-player-a')) return json(playerA)
    throw new Error(`unexpected ${path}`)
  })

  expect(html).toContain('Sample Player A')
  expect(html).toContain(CLUB_EMPTY_COPY)
  expect(html).toContain('Sample Player B')
  expect(html).toContain(UPCOMING_EMPTY_COPY)
  expect(html).not.toContain('versus')
  expect(html).not.toContain('First serve')
})

test('basketball profile renders without tennis-only chrome', async () => {
  const { html } = await renderAthlete('sample-hooper', (path) => {
    if (path === publicAthletePath('sample-hooper')) return json(basketballer)
    throw new Error(`unexpected ${path}`)
  })

  expect(html).toContain('Sample Hooper')
  expect(html).toContain('Basketball')
  expect(html).toContain('88-81')
  expect(html).not.toContain('versus')
  expect(html).not.toContain('Set 1')
})

test('football profile with no appearances shows the empty copy', async () => {
  const empty = {
    ...karlo,
    history: [] as typeof karlo.history,
    upcoming: [] as typeof karlo.upcoming,
  }
  const { html } = await renderAthlete('karlo-brkic', (path) => {
    if (path === publicAthletePath('karlo-brkic')) return json(empty)
    throw new Error(`unexpected ${path}`)
  })

  expect(html).toContain(HISTORY_EMPTY_COPY)
  expect(html).toContain(UPCOMING_EMPTY_COPY)
})

test('an unknown slug triggers not found', async () => {
  await expect(
    renderAthlete('nobody', (path) => {
      if (path === publicAthletePath('nobody')) return json({ message: 'Unknown athlete' }, 404)
      throw new Error(`unexpected ${path}`)
    }),
  ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/)
})

test('a failed profile fetch renders unavailable copy', async () => {
  const { html } = await renderAthlete('sample-player-a', () => {
    throw new Error('down')
  })

  expect(html).toContain(ATHLETE_UNAVAILABLE_COPY)
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
      description: 'Appearances and profile for Sample Player A.',
      openGraph: {
        title: 'Sample Player A · Cro Sport Hub',
        description: 'Appearances and profile for Sample Player A.',
        type: 'website',
        url: 'http://localhost:3000/athletes/sample-player-a',
        siteName: SITE_NAME,
      },
      twitter: {
        card: 'summary',
        title: 'Sample Player A · Cro Sport Hub',
        description: 'Appearances and profile for Sample Player A.',
      },
    })
  } finally {
    globalThis.fetch = previous
  }
})
