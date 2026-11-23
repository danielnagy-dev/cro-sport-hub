import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import ReprezentacijaPage, { metadata } from '../app/reprezentacija/page'
import { nationalTeamSchedulePath } from '../lib/api-client'
import { t } from '../lib/messages'
import {
  DEFAULT_NATIONAL_TEAM_SPORT,
  parseTeamSport,
  SEEDED_NATIONAL_TEAMS,
  teamForSport,
} from '../lib/national-teams'
import type { NationalTeamSchedule, PublicAppearance } from '../lib/public-editorial-schemas'
import {
  SCHEDULE_BUCKET_EMPTY_COPY,
  SCHEDULE_UNAVAILABLE_COPY,
  ScheduleMain,
} from '../lib/schedule-view'
import { SITE_NAME } from '../lib/site-metadata'

const past: PublicAppearance = {
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

const current: PublicAppearance = {
  id: 'appearance-live-nt',
  sportSlug: 'football',
  competitionId: 'comp-sample-league',
  nationalTeam: {
    id: 'nt-croatia-football',
    slug: 'croatia-football',
    name: 'Sample Croatia Football',
  },
  opponentLabel: 'Sample Live Rival',
  startsAt: '2026-11-12T12:00:00+00:00',
  status: 'in_progress',
}

const upcoming: PublicAppearance = {
  id: 'appearance-upcoming-nt',
  sportSlug: 'football',
  competitionId: 'comp-sample-league',
  nationalTeam: {
    id: 'nt-croatia-football',
    slug: 'croatia-football',
    name: 'Sample Croatia Football',
  },
  opponentLabel: 'Sample Future',
  startsAt: '2026-12-01T19:00:00+00:00',
  status: 'scheduled',
}

const footballSchedule: NationalTeamSchedule = {
  team: {
    id: 'nt-croatia-football',
    slug: 'croatia-football',
    name: 'Sample Croatia Football',
    sportSlug: 'football',
  },
  past: [past],
  current: [current],
  upcoming: [upcoming],
}

const basketballSchedule: NationalTeamSchedule = {
  team: {
    id: 'nt-croatia-basketball',
    slug: 'croatia-basketball',
    name: 'Sample Croatia Basketball',
    sportSlug: 'basketball',
  },
  past: [
    {
      id: 'appearance-sample-basketball-nt',
      sportSlug: 'basketball',
      competitionId: 'comp-sample-hoops',
      nationalTeam: {
        id: 'nt-croatia-basketball',
        slug: 'croatia-basketball',
        name: 'Sample Croatia Basketball',
      },
      opponentLabel: 'Sample Visitors',
      startsAt: '2026-11-16T18:30:00+00:00',
      endsAt: '2026-11-16T20:15:00+00:00',
      status: 'completed',
      result: { score: '78-71' },
    },
  ],
  current: [],
  upcoming: [],
}

async function renderPage(respond: () => Response | Promise<Response>, sport?: string) {
  const previous = globalThis.fetch
  const urls: string[] = []
  globalThis.fetch = async (input) => {
    urls.push(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    return respond()
  }
  try {
    const searchParams = sport === undefined ? Promise.resolve({}) : Promise.resolve({ sport })
    return {
      html: renderToStaticMarkup(await ReprezentacijaPage({ searchParams })),
      urls,
    }
  } finally {
    globalThis.fetch = previous
  }
}

test('seeded teams and sport query resolve only available sports', () => {
  expect(SEEDED_NATIONAL_TEAMS.map((team) => team.sportSlug)).toEqual(['football', 'basketball'])
  expect(teamForSport('football')?.slug).toBe('croatia-football')
  expect(teamForSport('tennis')).toBeUndefined()
  expect(parseTeamSport(undefined)).toBe(DEFAULT_NATIONAL_TEAM_SPORT)
  expect(parseTeamSport('basketball')).toBe('basketball')
  expect(parseTeamSport('tennis')).toBe(DEFAULT_NATIONAL_TEAM_SPORT)
  expect(parseTeamSport('handball')).toBe(DEFAULT_NATIONAL_TEAM_SPORT)
})

test('schedule buckets, sport filter, empty and unavailable', async () => {
  const now = new Date('2026-11-12T18:00:00+00:00')
  const html = renderToStaticMarkup(
    ScheduleMain({
      sport: 'football',
      teams: SEEDED_NATIONAL_TEAMS,
      schedule: footballSchedule,
      now,
    }),
  )
  expect(html).toContain(`<h1>${t('reprezentacija.title')}</h1>`)
  expect(html).toContain(t('reprezentacija.lead'))
  expect(html).toContain(`aria-label="${t('reprezentacija.sport-aria')}"`)
  expect(html).toContain('href="/reprezentacija?sport=football"')
  expect(html).toContain('href="/reprezentacija?sport=basketball"')
  expect(html).toContain('aria-current="page"')
  expect(html).toContain(`<h2>${t('reprezentacija.past')}</h2>`)
  expect(html).toContain(`<h2>${t('reprezentacija.current')}</h2>`)
  expect(html).toContain(`<h2>${t('reprezentacija.upcoming')}</h2>`)
  expect(html).toContain('Sample Neighbours')
  expect(html).toContain('Sample Live Rival')
  expect(html).toContain('Sample Future')
  expect(html).toContain('1-0')
  expect(html).not.toContain('MatchCard')

  const empty = renderToStaticMarkup(
    ScheduleMain({
      sport: 'basketball',
      teams: SEEDED_NATIONAL_TEAMS,
      schedule: { ...basketballSchedule, past: [], current: [], upcoming: [] },
      now,
    }),
  )
  expect(empty).toContain(SCHEDULE_BUCKET_EMPTY_COPY)
  expect(empty).not.toContain('Sample Visitors')

  expect(
    renderToStaticMarkup(
      ScheduleMain({
        sport: 'football',
        teams: SEEDED_NATIONAL_TEAMS,
        schedule: undefined,
        now,
      }),
    ),
  ).toContain(SCHEDULE_UNAVAILABLE_COPY)

  const footballPath = nationalTeamSchedulePath('croatia-football', 'football')
  const ok = await renderPage(
    () => new Response(JSON.stringify(footballSchedule), { status: 200 }),
    'football',
  )
  expect(ok.urls).toEqual([`http://localhost:3001${footballPath}`])
  expect(ok.html).toContain('Sample Croatia Football')

  const basketballPath = nationalTeamSchedulePath('croatia-basketball', 'basketball')
  const switched = await renderPage(
    () => new Response(JSON.stringify(basketballSchedule), { status: 200 }),
    'basketball',
  )
  expect(switched.urls).toEqual([`http://localhost:3001${basketballPath}`])
  expect(switched.html).toContain('Sample Croatia Basketball')
  expect(switched.html).toContain(SCHEDULE_BUCKET_EMPTY_COPY)

  expect((await renderPage(() => Promise.reject(new Error('down')))).html).toContain(
    SCHEDULE_UNAVAILABLE_COPY,
  )
})

test('Reprezentacija metadata matches the schedule URL', () => {
  const title = `${t('reprezentacija.title')} · ${t('chrome.brand')}`
  const description = t('reprezentacija.lead')
  expect(metadata).toMatchObject({
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'http://localhost:3000/reprezentacija',
      siteName: SITE_NAME,
    },
    twitter: { card: 'summary', title, description },
  })
})
