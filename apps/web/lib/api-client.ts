import {
  athleteNameListSchema,
  publishedMatchPageSchema,
  publicAthleteSchema,
  sportSchema,
  type AthleteName,
  type PublicAthlete,
  type PublishedMatchPage,
  type Sport,
  type SportSlug,
} from '@cro-sport-hub/shared-types'
import {
  nationalTeamScheduleSchema,
  publicAppearanceListSchema,
  publicAthleteIndexSchema,
  publicAthleteProfileSchema,
  type NationalTeamSchedule,
  type PublicAppearance,
  type PublicAthleteIndexItem,
  type PublicAthleteProfile,
} from './public-editorial-schemas'

export const sportsPath = '/api/sports'
export const matchesPath = '/api/matches'
export const tennisMatchesPath = `${matchesPath}/tennis`
export const footballMatchesPath = `${matchesPath}/football`
export const athletesPath = '/api/athletes'
export const publicAppearancesPath = '/api/public/appearances'
export const publicAthletesPath = '/api/public/athletes'

export function athletePath(slug: string): string {
  return `${athletesPath}/${slug}`
}

export function athletesBySportPath(sport: SportSlug): string {
  return `${athletesPath}?sport=${sport}`
}

export function publicDayAppearancesPath(day: string): string {
  return `${publicAppearancesPath}?day=${day}`
}

export function publicAthletesBySportPath(sport: SportSlug): string {
  return `${publicAthletesPath}?sport=${sport}`
}

export function publicAthletePath(slug: string): string {
  return `${publicAthletesPath}/${slug}`
}

export function nationalTeamSchedulePath(slug: string, sport?: SportSlug): string {
  const base = `/api/public/national-teams/${slug}/schedule`
  return sport === undefined ? base : `${base}?sport=${sport}`
}

export class ApiClientError extends Error {
  readonly status: number

  constructor(path: string, status: number) {
    super(`GET ${path} returned HTTP ${status}`)
    this.name = 'ApiClientError'
    this.status = status
  }
}

export type ApiClient = {
  sports: () => Promise<Sport[]>
  matches: () => Promise<PublishedMatchPage>
  matchesTennis: () => Promise<PublishedMatchPage>
  matchesFootball: () => Promise<PublishedMatchPage>
  athlete: (slug: string) => Promise<PublicAthlete>
  athletesBySport: (sport: SportSlug) => Promise<AthleteName[]>
  dayAppearances: (day: string) => Promise<PublicAppearance[]>
  publicAthletes: (sport: SportSlug) => Promise<PublicAthleteIndexItem[]>
  publicAthlete: (slug: string) => Promise<PublicAthleteProfile>
  nationalTeamSchedule: (slug: string, sport?: SportSlug) => Promise<NationalTeamSchedule>
}

type ApiClientOptions = {
  fetch?: typeof fetch
  baseUrl?: string
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const fetchImpl =
    options.fetch ??
    ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init))
  const baseUrl = options.baseUrl ?? ''

  async function read(path: string): Promise<unknown> {
    const url = baseUrl === '' ? path : new URL(path, baseUrl).href
    const response = await fetchImpl(url, { headers: { accept: 'application/json' } })
    if (!response.ok) throw new ApiClientError(path, response.status)
    const body: unknown = JSON.parse(await response.text())
    return body
  }

  return {
    async sports() {
      return sportSchema.array().parse(await read(sportsPath))
    },
    async matches() {
      return publishedMatchPageSchema.parse(await read(matchesPath))
    },
    async matchesTennis() {
      return publishedMatchPageSchema.parse(await read(tennisMatchesPath))
    },
    async matchesFootball() {
      return publishedMatchPageSchema.parse(await read(footballMatchesPath))
    },
    async athlete(slug) {
      return publicAthleteSchema.parse(await read(athletePath(slug)))
    },
    async athletesBySport(sport) {
      return athleteNameListSchema.parse(await read(athletesBySportPath(sport)))
    },
    async dayAppearances(day) {
      return publicAppearanceListSchema.parse(await read(publicDayAppearancesPath(day)))
    },
    async publicAthletes(sport) {
      return publicAthleteIndexSchema.parse(await read(publicAthletesBySportPath(sport)))
    },
    async publicAthlete(slug) {
      return publicAthleteProfileSchema.parse(await read(publicAthletePath(slug)))
    },
    async nationalTeamSchedule(slug, sport) {
      return nationalTeamScheduleSchema.parse(await read(nationalTeamSchedulePath(slug, sport)))
    },
  }
}
