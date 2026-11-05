import {
  publicTennisResultSchema,
  tennisPercentages,
  type PublicTennisResult,
  type TennisStatCounts,
} from '@cro-sport-hub/shared-types'
import { and, desc, eq, or } from 'drizzle-orm'
import { alias, type PgDatabase, type PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { readParsed } from '../../catalog/errors.js'
import * as schema from '../../catalog/schema.js'

const { athletes, competitions, matches, tennisMatches, tennisMatchStats } = schema
type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>

type ResultRow = {
  id: string
  competition: string
  date: string
  round: string
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
  winnerId: string
  bestOf: number
  score: unknown
  retired: boolean | null
  aces: number | null
  doubleFaults: number | null
  firstServeIn: number | null
  firstServeTotal: number | null
  firstServePointsWon: number | null
  secondServePointsWon: number | null
  secondServeTotal: number | null
  breakPointsSaved: number | null
  breakPointsFaced: number | null
  breakPointsWon: number | null
  breakPointsTotal: number | null
  totalPointsWon: number | null
}

function toResult(row: ResultRow, athleteId: string): PublicTennisResult {
  const opponent = row.playerAId === athleteId ? row.playerBName : row.playerAName
  const winner = row.winnerId === athleteId ? 'athlete' : 'opponent'
  const listed = {
    id: row.id,
    competition: row.competition,
    date: row.date,
    round: row.round,
    opponent,
    winner,
    bestOf: row.bestOf,
    score: row.score,
    retired: row.retired ?? false,
  }
  if (row.aces === null) {
    return publicTennisResultSchema.parse({ ...listed, percentages: null })
  }
  const counts: TennisStatCounts = {
    aces: row.aces,
    doubleFaults: row.doubleFaults ?? 0,
    firstServeIn: row.firstServeIn ?? 0,
    firstServeTotal: row.firstServeTotal ?? 0,
    firstServePointsWon: row.firstServePointsWon ?? 0,
    secondServePointsWon: row.secondServePointsWon ?? 0,
    secondServeTotal: row.secondServeTotal ?? 0,
    breakPointsSaved: row.breakPointsSaved ?? 0,
    breakPointsFaced: row.breakPointsFaced ?? 0,
    breakPointsWon: row.breakPointsWon ?? 0,
    breakPointsTotal: row.breakPointsTotal ?? 0,
    totalPointsWon: row.totalPointsWon ?? 0,
  }
  return publicTennisResultSchema.parse({
    ...listed,
    ...counts,
    percentages: tennisPercentages(counts),
  })
}

/** Published tennis matches for one athlete, newest first. Draft and review rows stay out. */
export async function listTennisResultsForAthlete(
  db: CatalogDb,
  athleteId: string,
): Promise<PublicTennisResult[]> {
  return readParsed(async () => {
    const playerA = alias(athletes, 'result_player_a')
    const playerB = alias(athletes, 'result_player_b')
    const rows = await db
      .select({
        id: matches.id,
        competition: competitions.name,
        date: matches.date,
        round: matches.round,
        playerAId: tennisMatches.playerAId,
        playerBId: tennisMatches.playerBId,
        playerAName: playerA.name,
        playerBName: playerB.name,
        winnerId: tennisMatches.winnerId,
        bestOf: tennisMatches.bestOf,
        score: tennisMatches.score,
        retired: tennisMatches.retired,
        aces: tennisMatchStats.aces,
        doubleFaults: tennisMatchStats.doubleFaults,
        firstServeIn: tennisMatchStats.firstServeIn,
        firstServeTotal: tennisMatchStats.firstServeTotal,
        firstServePointsWon: tennisMatchStats.firstServePointsWon,
        secondServePointsWon: tennisMatchStats.secondServePointsWon,
        secondServeTotal: tennisMatchStats.secondServeTotal,
        breakPointsSaved: tennisMatchStats.breakPointsSaved,
        breakPointsFaced: tennisMatchStats.breakPointsFaced,
        breakPointsWon: tennisMatchStats.breakPointsWon,
        breakPointsTotal: tennisMatchStats.breakPointsTotal,
        totalPointsWon: tennisMatchStats.totalPointsWon,
      })
      .from(matches)
      .innerJoin(tennisMatches, eq(tennisMatches.matchId, matches.id))
      .innerJoin(competitions, eq(competitions.id, matches.competitionId))
      .innerJoin(playerA, eq(playerA.id, tennisMatches.playerAId))
      .innerJoin(playerB, eq(playerB.id, tennisMatches.playerBId))
      .leftJoin(
        tennisMatchStats,
        and(eq(tennisMatchStats.matchId, matches.id), eq(tennisMatchStats.athleteId, athleteId)),
      )
      .where(
        and(
          eq(matches.status, 'published'),
          or(eq(tennisMatches.playerAId, athleteId), eq(tennisMatches.playerBId, athleteId)),
        ),
      )
      .orderBy(desc(matches.date), desc(matches.id))
    return rows.map((row) => toResult(row, athleteId))
  })
}
