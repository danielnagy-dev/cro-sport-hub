import type { Metadata } from 'next'
import { createApiClient } from '../../lib/api-client'
import { t } from '../../lib/messages'
import {
  DEFAULT_NATIONAL_TEAM_SPORT,
  parseTeamSport,
  SEEDED_NATIONAL_TEAMS,
  teamForSport,
} from '../../lib/national-teams'
import type { NationalTeamSchedule } from '../../lib/public-editorial-schemas'
import { ScheduleMain } from '../../lib/schedule-view'
import { shareMetadata } from '../../lib/site-metadata'

const RESULTS_API_ORIGIN = 'http://localhost:3001'

const TITLE = `${t('reprezentacija.title')} · ${t('chrome.brand')}`
const DESCRIPTION = t('reprezentacija.lead')

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...shareMetadata({
    pathname: '/reprezentacija',
    title: TITLE,
    description: DESCRIPTION,
  }),
}

type ReprezentacijaSearchParams = Promise<{ sport?: string | string[] }>

export default async function ReprezentacijaPage({
  searchParams,
}: {
  searchParams?: ReprezentacijaSearchParams
} = {}) {
  const params = searchParams === undefined ? {} : await searchParams
  const raw = params.sport
  const sport = parseTeamSport(Array.isArray(raw) ? raw[0] : raw, DEFAULT_NATIONAL_TEAM_SPORT)
  const team = teamForSport(sport) ?? SEEDED_NATIONAL_TEAMS[0]
  let schedule: NationalTeamSchedule | undefined
  try {
    schedule = await createApiClient({ baseUrl: RESULTS_API_ORIGIN }).nationalTeamSchedule(
      team.slug,
      sport,
    )
  } catch {
    schedule = undefined
  }

  return <ScheduleMain sport={sport} teams={SEEDED_NATIONAL_TEAMS} schedule={schedule} />
}
