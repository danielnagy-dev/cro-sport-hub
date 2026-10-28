import {
  athleteLookupSchema,
  competitionLookupSchema,
  teamLookupSchema,
  type AthleteLookup,
  type CompetitionLookup,
  type SportSlug,
  type TeamLookup,
} from '@cro-sport-hub/shared-types'
import { asc, eq } from 'drizzle-orm'
import type { CatalogDb } from './errors.js'
import * as schema from './schema.js'

const { athletes, competitions, sports, teams } = schema

/** Competitions for one sport, name order. */
export async function selectCompetitions(
  db: CatalogDb,
  sport: SportSlug,
): Promise<CompetitionLookup[]> {
  const rows = await db
    .select({ id: competitions.id, name: competitions.name, season: competitions.season })
    .from(competitions)
    .innerJoin(sports, eq(sports.id, competitions.sportId))
    .where(eq(sports.slug, sport))
    .orderBy(asc(competitions.name))
  return rows.map((row) => competitionLookupSchema.parse(row))
}

/** Athletes for one sport, name order. */
export async function selectAthletes(db: CatalogDb, sport: SportSlug): Promise<AthleteLookup[]> {
  const rows = await db
    .select({ id: athletes.id, name: athletes.name })
    .from(athletes)
    .where(eq(athletes.sportSlug, sport))
    .orderBy(asc(athletes.name))
  return rows.map((row) => athleteLookupSchema.parse(row))
}

/** Football clubs, name order. Tennis has no clubs. */
export async function selectTeams(db: CatalogDb): Promise<TeamLookup[]> {
  const rows = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.sportSlug, 'football'))
    .orderBy(asc(teams.name))
  return rows.map((row) => teamLookupSchema.parse(row))
}
