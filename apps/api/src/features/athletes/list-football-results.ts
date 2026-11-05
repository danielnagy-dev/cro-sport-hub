import { publicFootballResultSchema, type PublicFootballResult } from '@cro-sport-hub/shared-types'
import { and, desc, eq } from 'drizzle-orm'
import { type PgDatabase, type PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { readParsed } from '../../catalog/errors.js'
import * as schema from '../../catalog/schema.js'

const { appearances, competitions, matches, teams } = schema
type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>

/** Published football appearances for one athlete, newest first. Draft and review rows stay out. */
export async function listFootballResultsForAthlete(
  db: CatalogDb,
  athleteId: string,
): Promise<PublicFootballResult[]> {
  return readParsed(async () => {
    const rows = await db
      .select({
        id: matches.id,
        competition: competitions.name,
        date: matches.date,
        round: matches.round,
        club: teams.name,
        started: appearances.started,
        minutes: appearances.minutes,
        goals: appearances.goals,
        assists: appearances.assists,
        yellowCards: appearances.yellowCards,
        redCard: appearances.redCard,
      })
      .from(appearances)
      .innerJoin(matches, eq(matches.id, appearances.matchId))
      .innerJoin(competitions, eq(competitions.id, matches.competitionId))
      .innerJoin(teams, eq(teams.id, appearances.teamId))
      .where(and(eq(matches.status, 'published'), eq(appearances.athleteId, athleteId)))
      .orderBy(desc(matches.date), desc(matches.id))
    return rows.map((row) => publicFootballResultSchema.parse(row))
  })
}
