import { expect, test } from 'vite-plus/test'
import {
  createApiClient,
  athletePath,
  athletesBySportPath,
  footballMatchesPath,
  matchesPath,
  sportsPath,
  tennisMatchesPath,
} from '../lib/api-client'

const sport = { id: 'sport-tennis', slug: 'tennis', name: 'Tennis' }

const match = {
  id: 'match-1',
  sportId: 'sport-tennis',
  competitionId: 'comp-1',
  date: '2026-10-18',
  round: 'QF',
  status: 'published',
  source: 'manual',
  createdBy: 'editor-1',
  reviewedBy: 'editor-2',
  publishedAt: '2026-10-18T18:00:00+00:00',
}

const karlo = {
  slug: 'karlo-brkic',
  name: 'Karlo Brkić',
  sport: 'football' as const,
  country: 'HR',
  position: 'Forward',
  clubs: [{ name: 'Sample Home', from: '2025-07-01' }],
}

const athleteNames = [{ slug: 'sample-player-a', name: 'Sample Player A' }]

const publishedPage = {
  items: [
    {
      id: 'match-sample-league',
      sport: 'football',
      competition: 'Sample League',
      date: '2026-10-19',
      round: 'Matchday 8',
      homeTeam: 'Sample Home',
      awayTeam: 'Sample Away',
      homeGoals: 2,
      awayGoals: 1,
    },
  ],
  limit: 20,
  offset: 0,
  total: 1,
}

function routes(bodies: Record<string, { status?: number; body: unknown }>) {
  const calls: { url: string; accept: string | null }[] = []
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    calls.push({ url, accept: new Headers(init?.headers).get('accept') })
    const route = Object.entries(bodies).find(([path]) => url.endsWith(path))
    if (route === undefined) throw new Error(`unexpected ${url}`)
    return new Response(JSON.stringify(route[1].body), { status: route[1].status ?? 200 })
  }
  return { fetchImpl, calls }
}

test('parses sports and published match pages from the read paths', async () => {
  const { fetchImpl, calls } = routes({
    [sportsPath]: { body: [sport] },
    [matchesPath]: { body: publishedPage },
    [tennisMatchesPath]: { body: { ...publishedPage, items: [] } },
    [footballMatchesPath]: { body: publishedPage },
  })
  const api = createApiClient({ fetch: fetchImpl, baseUrl: 'http://localhost:3001' })

  await expect(api.sports()).resolves.toEqual([sport])
  await expect(api.matches()).resolves.toEqual(publishedPage)
  await expect(api.matchesTennis()).resolves.toEqual({ ...publishedPage, items: [] })
  await expect(api.matchesFootball()).resolves.toEqual(publishedPage)
  expect(calls).toEqual([
    { url: 'http://localhost:3001/api/sports', accept: 'application/json' },
    { url: 'http://localhost:3001/api/matches', accept: 'application/json' },
    { url: 'http://localhost:3001/api/matches/tennis', accept: 'application/json' },
    { url: 'http://localhost:3001/api/matches/football', accept: 'application/json' },
  ])
})

test('requests a same-origin path when no origin is set', async () => {
  const { fetchImpl, calls } = routes({ [sportsPath]: { body: [sport] } })
  const api = createApiClient({ fetch: fetchImpl })

  await expect(api.sports()).resolves.toEqual([sport])
  expect(calls.map((call) => call.url)).toEqual([sportsPath])
})

test('rejects a failed response before parsing the body', async () => {
  const fetchImpl: typeof fetch = async () => new Response('nope', { status: 503 })
  const api = createApiClient({ fetch: fetchImpl })

  await expect(api.sports()).rejects.toThrow('GET /api/sports returned HTTP 503')
})

test('rejects a bare Match array', async () => {
  const { fetchImpl } = routes({ [matchesPath]: { body: [match] } })
  const api = createApiClient({ fetch: fetchImpl })

  await expect(api.matches()).rejects.toThrow(/expected object, received array/)
})

test('parses athlete profile and sport name lists', async () => {
  const { fetchImpl, calls } = routes({
    [athletePath('karlo-brkic')]: { body: karlo },
    [athletesBySportPath('tennis')]: { body: athleteNames },
  })
  const api = createApiClient({ fetch: fetchImpl, baseUrl: 'http://localhost:3001' })

  await expect(api.athlete('karlo-brkic')).resolves.toEqual(karlo)
  await expect(api.athletesBySport('tennis')).resolves.toEqual(athleteNames)
  expect(calls.map((call) => call.url)).toEqual([
    'http://localhost:3001/api/athletes/karlo-brkic',
    'http://localhost:3001/api/athletes?sport=tennis',
  ])
})
