import {
  editorFootballDraftSchema,
  footballMatchSchema,
  type EditorFootballDraft,
} from '@cro-sport-hub/shared-types'
import { eq } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { CatalogError, parseRecord, readParsed } from './errors.js'
import * as schema from './schema.js'

const { appearances, footballMatches, matches } = schema
type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>

/** Football match body for editors. Tennis and missing ids are `Unknown match`. */
export async function readEditorFootballDraft(
  db: CatalogDb,
  matchId: string,
): Promise<EditorFootballDraft> {
  return readParsed(async () => {
    const headerRows = await db.select().from(matches).where(eq(matches.id, matchId))
    const header = headerRows[0]
    if (header === undefined || header.sportSlug !== 'football') {
      throw new CatalogError('unknown-ref', 'Unknown match')
    }
    const detailRows = await db
      .select()
      .from(footballMatches)
      .where(eq(footballMatches.matchId, matchId))
    const detailRow = detailRows[0]
    if (detailRow === undefined) throw new CatalogError('unknown-ref', 'Unknown match')
    const detail = parseRecord(footballMatchSchema, {
      matchId: detailRow.matchId,
      homeTeamId: detailRow.homeTeamId,
      awayTeamId: detailRow.awayTeamId,
      homeGoals: detailRow.homeGoals,
      awayGoals: detailRow.awayGoals,
    })
    const lines = await db.select().from(appearances).where(eq(appearances.matchId, matchId))
    const draftAppearances = lines.map((row) => ({
      athleteId: row.athleteId,
      teamId: row.teamId,
      started: row.started,
      minutes: row.minutes,
      goals: row.goals,
      assists: row.assists,
      yellowCards: row.yellowCards,
      redCard: row.redCard,
    }))
    return editorFootballDraftSchema.parse({
      id: matchId,
      competitionId: header.competitionId,
      date: header.date,
      round: header.round,
      status: header.status,
      homeTeamId: detail.homeTeamId,
      awayTeamId: detail.awayTeamId,
      homeGoals: detail.homeGoals,
      awayGoals: detail.awayGoals,
      ...(draftAppearances.length > 0 ? { appearances: draftAppearances } : {}),
    })
  })
}
