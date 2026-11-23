import { sportSlugSchema, type SportSlug } from '@cro-sport-hub/shared-types'

export type SeededNationalTeam = {
  slug: string
  sportSlug: SportSlug
}

export const SEEDED_NATIONAL_TEAMS: readonly SeededNationalTeam[] = [
  { slug: 'croatia-football', sportSlug: 'football' },
  { slug: 'croatia-basketball', sportSlug: 'basketball' },
]

export const DEFAULT_NATIONAL_TEAM_SPORT: SportSlug = 'football'

export function teamForSport(sport: SportSlug): SeededNationalTeam | undefined {
  return SEEDED_NATIONAL_TEAMS.find((team) => team.sportSlug === sport)
}

export function parseTeamSport(
  value: string | undefined,
  fallback: SportSlug = DEFAULT_NATIONAL_TEAM_SPORT,
): SportSlug {
  const parsed = sportSlugSchema.safeParse(value)
  if (!parsed.success) return fallback
  return teamForSport(parsed.data) === undefined ? fallback : parsed.data
}
