import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import HomePage, { metadata } from '../app/page'
import { publicDayAppearancesPath } from '../lib/api-client'
import { appearanceParticipantLabel, isLiveAppearance } from '../lib/day-list'
import type { PublicAppearance } from '../lib/public-editorial-schemas'
import { DAY_EMPTY_COPY, DAY_UNAVAILABLE_COPY, LIVE_LABEL, ResultsMain } from '../lib/results-view'
import { SITE_NAME } from '../lib/site-metadata'

const team: PublicAppearance = {
  id: 'appearance-sample-football-nt',
  sportSlug: 'football',
  competitionId: 'comp-sample-league',
  nationalTeam: {
    id: 'nt-croatia-football',
    slug: 'croatia-football',
    name: 'Sample Croatia Football',
  },
  opponentLabel: 'Sample Neighbours',
  startsAt: '2026-11-12T19:45:00+00:00',
  endsAt: '2026-11-12T21:35:00+00:00',
  status: 'completed',
  result: { score: '1-0' },
}
const basketball: PublicAppearance = {
  id: 'appearance-sample-basketball',
  sportSlug: 'basketball',
  competitionId: 'comp-sample-hoops',
  athlete: { id: 'athlete-hooper-a', slug: 'sample-hooper-a', name: 'Sample Hooper A' },
  opponentLabel: 'Sample Opponents',
  startsAt: '2026-11-15T17:00:00+00:00',
  status: 'scheduled',
}
const live: PublicAppearance = {
  id: 'appearance-live',
  sportSlug: 'tennis',
  competitionId: 'comp-sample-cup',
  athlete: { id: 'athlete-player-a', slug: 'sample-player-a', name: 'Sample Player A' },
  opponentLabel: 'Sample Rival',
  startsAt: '2026-11-12T12:00:00+00:00',
  status: 'in_progress',
}

async function renderHome(respond: () => Response | Promise<Response>, day = '2026-11-12') {
  const previous = globalThis.fetch
  const urls: string[] = []
  globalThis.fetch = async (input) => {
    urls.push(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    return respond()
  }
  try {
    return {
      html: renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve({ day }) })),
      urls,
    }
  } finally {
    globalThis.fetch = previous
  }
}

test('day list: team once, basketball, live vs result, fetch empty and down', async () => {
  const now = new Date('2026-11-12T18:00:00+00:00')
  expect(appearanceParticipantLabel(team)).toBe('Sample Croatia Football')
  expect(isLiveAppearance(live, now)).toBe(true)
  expect(isLiveAppearance({ ...live, result: { sets: '1-0' } }, now)).toBe(false)
  expect(isLiveAppearance(live, new Date('2026-11-12T11:00:00+00:00'))).toBe(false)

  const list = renderToStaticMarkup(
    ResultsMain({
      day: '2026-11-15',
      items: [team, basketball],
      now: new Date('2026-11-15T10:00:00+00:00'),
    }),
  )
  expect(list).toMatch(/Sample Croatia Football[\s\S]*Sample Hooper A/)
  expect(list).toContain('basketball')
  expect(list).toContain('1-0')
  expect(list).not.toContain(LIVE_LABEL)
  expect(list).toContain('href="/?day=2026-11-14"')
  expect(renderToStaticMarkup(ResultsMain({ day: '2026-11-12', items: [live], now }))).toContain(
    LIVE_LABEL,
  )

  const ok = await renderHome(() => new Response(JSON.stringify([team]), { status: 200 }))
  expect(ok.urls).toEqual([`http://localhost:3001${publicDayAppearancesPath('2026-11-12')}`])
  expect(ok.html).toContain('Sample Croatia Football')
  expect(
    (await renderHome(() => new Response('[]', { status: 200 }), '2026-11-01')).html,
  ).toContain(DAY_EMPTY_COPY)
  expect((await renderHome(() => Promise.reject(new Error('down')))).html).toContain(
    DAY_UNAVAILABLE_COPY,
  )
})

test('Početna metadata matches the home URL', () => {
  const title = 'Početna · Cro Sport Hub'
  const description = 'Nastupi po danu.'
  expect(metadata).toMatchObject({
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'http://localhost:3000/',
      siteName: SITE_NAME,
    },
    twitter: { card: 'summary', title, description },
  })
  expect(JSON.stringify(metadata)).not.toContain('og:image')
})
