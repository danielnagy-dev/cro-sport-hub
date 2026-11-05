import {
  editorTennisDraftSchema,
  tennisMatchSchema,
  tennisMatchStatsSchema,
  type EditorTennisDraft,
  type TennisMatchStats,
} from '@cro-sport-hub/shared-types'
import { and, eq } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { CatalogError, parseRecord, readParsed } from './errors.js'
import * as schema from './schema.js'

const { matches, tennisMatches, tennisMatchStats } = schema
type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>

type DraftStatRow = NonNullable<EditorTennisDraft['stats']>[number]

function draftStat(stat: TennisMatchStats): DraftStatRow {
  return {
    athleteId: stat.athleteId,
    aces: stat.aces,
    doubleFaults: stat.doubleFaults,
    firstServeIn: stat.firstServeIn,
    firstServeTotal: stat.firstServeTotal,
    firstServePointsWon: stat.firstServePointsWon,
    secondServePointsWon: stat.secondServePointsWon,
    secondServeTotal: stat.secondServeTotal,
    breakPointsSaved: stat.breakPointsSaved,
    breakPointsFaced: stat.breakPointsFaced,
    breakPointsWon: stat.breakPointsWon,
    breakPointsTotal: stat.breakPointsTotal,
    totalPointsWon: stat.totalPointsWon,
  }
}

async function readStat(
  db: CatalogDb,
  matchId: string,
  athleteId: string,
): Promise<ReturnType<typeof draftStat> | undefined> {
  const rows = await db
    .select()
    .from(tennisMatchStats)
    .where(and(eq(tennisMatchStats.matchId, matchId), eq(tennisMatchStats.athleteId, athleteId)))
  const row = rows[0]
  if (row === undefined) return undefined
  return draftStat(
    parseRecord(tennisMatchStatsSchema, {
      matchId: row.matchId,
      athleteId: row.athleteId,
      aces: row.aces,
      doubleFaults: row.doubleFaults,
      firstServeIn: row.firstServeIn,
      firstServeTotal: row.firstServeTotal,
      firstServePointsWon: row.firstServePointsWon,
      secondServePointsWon: row.secondServePointsWon,
      secondServeTotal: row.secondServeTotal,
      breakPointsSaved: row.breakPointsSaved,
      breakPointsFaced: row.breakPointsFaced,
      breakPointsWon: row.breakPointsWon,
      breakPointsTotal: row.breakPointsTotal,
      totalPointsWon: row.totalPointsWon,
      ...(row.winners === null || row.winners === undefined ? {} : { winners: row.winners }),
      ...(row.unforcedErrors === null || row.unforcedErrors === undefined
        ? {}
        : { unforcedErrors: row.unforcedErrors }),
    }),
  )
}

/** Tennis match body for editors. Football and missing ids are `Unknown match`. */
export async function readEditorTennisDraft(
  db: CatalogDb,
  matchId: string,
): Promise<EditorTennisDraft> {
  return readParsed(async () => {
    const headerRows = await db.select().from(matches).where(eq(matches.id, matchId))
    const header = headerRows[0]
    if (header === undefined || header.sportSlug !== 'tennis') {
      throw new CatalogError('unknown-ref', 'Unknown match')
    }
    const detailRows = await db
      .select()
      .from(tennisMatches)
      .where(eq(tennisMatches.matchId, matchId))
    const detailRow = detailRows[0]
    if (detailRow === undefined) throw new CatalogError('unknown-ref', 'Unknown match')
    const detail = parseRecord(tennisMatchSchema, {
      matchId: detailRow.matchId,
      playerAId: detailRow.playerAId,
      playerBId: detailRow.playerBId,
      winnerId: detailRow.winnerId,
      bestOf: detailRow.bestOf,
      score: detailRow.score,
      ...(detailRow.retired === true ? { retired: true } : {}),
    })
    const stats = (
      await Promise.all([
        readStat(db, matchId, detail.playerAId),
        readStat(db, matchId, detail.playerBId),
      ])
    ).filter((row): row is NonNullable<typeof row> => row !== undefined)
    return editorTennisDraftSchema.parse({
      id: matchId,
      competitionId: header.competitionId,
      date: header.date,
      round: header.round,
      status: header.status,
      playerAId: detail.playerAId,
      playerBId: detail.playerBId,
      winnerId: detail.winnerId,
      bestOf: detail.bestOf,
      score: detail.score,
      ...(detail.retired === true ? { retired: true as const } : {}),
      ...(stats.length > 0 ? { stats } : {}),
    })
  })
}
