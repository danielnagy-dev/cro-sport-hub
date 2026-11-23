import { publicFootballResultSchema, type PublicFootballResult } from '@cro-sport-hub/shared-types'
import { and, desc, eq } from 'drizzle-orm'
import { type PgDatabase, type PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { readParsed } from '../../catalog/errors.js'
import * as schema from '../../catalog/schema.js'

const { competitions, matchAppearances, matches, teams } = schema
type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>

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
        started: matchAppearances.started,
        minutes: matchAppearances.minutes,
        goals: matchAppearances.goals,
        assists: matchAppearances.assists,
        yellowCards: matchAppearances.yellowCards,
        redCard: matchAppearances.redCard,
      })
      .from(matchAppearances)
      .innerJoin(matches, eq(matches.id, matchAppearances.matchId))
      .innerJoin(competitions, eq(competitions.id, matches.competitionId))
      .innerJoin(teams, eq(teams.id, matchAppearances.teamId))
      .where(and(eq(matches.status, 'published'), eq(matchAppearances.athleteId, athleteId)))
      .orderBy(desc(matches.date), desc(matches.id))
    return rows.map((row) => publicFootballResultSchema.parse(row))
  })
}
