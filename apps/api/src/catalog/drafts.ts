import {
  appearanceSchema,
  footballMatchSchema,
  idSchema,
  isoDateSchema,
  matchSchema,
  roundSchema,
  tennisMatchSchema,
  tennisMatchStatsSchema,
} from '@cro-sport-hub/shared-types'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { CatalogError, invalidRecord, parseRecord, type CatalogDb } from './errors.js'
import { competitionSport, matchSlug, sportIdFor, writeRecord } from './records.js'
import * as schema from './schema.js'

const { appearances, footballMatches, matches, tennisMatches, tennisMatchStats } = schema

const DRAFT_HEADER = {
  id: idSchema,
  competitionId: idSchema,
  date: isoDateSchema,
  round: roundSchema,
} as const
const tennisDraftSchema = z.strictObject({
  ...DRAFT_HEADER,
  playerAId: idSchema,
  playerBId: idSchema,
  winnerId: idSchema,
  bestOf: z.unknown(),
  score: z.unknown(),
  retired: z.boolean().optional(),
  stats: z.array(z.unknown()).max(2).optional(),
})
const footballDraftSchema = z.strictObject({
  ...DRAFT_HEADER,
  homeTeamId: idSchema,
  awayTeamId: idSchema,
  homeGoals: z.unknown(),
  awayGoals: z.unknown(),
  appearances: z.array(z.unknown()).max(50).optional(),
})

type DraftSaved = { id: string; status: 'draft'; sport: 'tennis' | 'football' }
type DraftHeader = { id: string; competitionId: string; date: string; round: string }
type DraftMode = 'create' | 'update'

function sameMatch(value: unknown, matchId: string): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value
  return { ...value, matchId }
}

function oneEach(ids: readonly string[]): void {
  if (new Set(ids).size !== ids.length) {
    throw new CatalogError('invalid', 'Each athlete is listed once')
  }
}

async function persistDraft(
  db: CatalogDb,
  sport: 'tennis' | 'football',
  header: DraftHeader,
  actorId: string,
  mode: DraftMode,
  detail: unknown,
  children: readonly unknown[],
  childKind: 'tennisMatchStats' | 'appearance',
): Promise<DraftSaved> {
  if ((await competitionSport(db, header.competitionId)) !== sport) {
    throw new CatalogError('invalid', 'The match sport does not match the competition')
  }
  if (mode === 'update' && (await matchSlug(db, header.id)) !== sport) {
    throw new CatalogError(
      'invalid',
      sport === 'tennis'
        ? 'A tennis match needs a tennis match'
        : 'A football match needs a football match',
    )
  }
  const sportId = await sportIdFor(db, sport)
  await db.transaction(async (tx) => {
    const database = tx as unknown as CatalogDb
    if (mode === 'create') {
      await writeRecord(
        database,
        'match',
        parseRecord(matchSchema, {
          id: header.id,
          sportId,
          competitionId: header.competitionId,
          date: header.date,
          round: header.round,
          status: 'draft',
          source: 'manual',
          createdBy: actorId,
        }),
      )
    } else {
      await database
        .update(matches)
        .set({
          competitionId: header.competitionId,
          date: header.date,
          round: header.round,
          status: 'draft',
          reviewedBy: null,
          publishedAt: null,
        })
        .where(eq(matches.id, header.id))
    }
    if (mode === 'update') {
      if (sport === 'tennis') {
        await database.delete(tennisMatchStats).where(eq(tennisMatchStats.matchId, header.id))
        await database.delete(tennisMatches).where(eq(tennisMatches.matchId, header.id))
      } else {
        await database.delete(appearances).where(eq(appearances.matchId, header.id))
        await database.delete(footballMatches).where(eq(footballMatches.matchId, header.id))
      }
    }
    await writeRecord(database, sport === 'tennis' ? 'tennisMatch' : 'footballMatch', detail)
    for (const child of children) await writeRecord(database, childKind, child)
  })
  return { id: header.id, status: 'draft', sport }
}

export async function saveDraft(
  db: CatalogDb,
  sport: 'tennis' | 'football',
  body: unknown,
  actorId: string,
  mode: DraftMode,
): Promise<DraftSaved> {
  if (sport === 'tennis') {
    const parsed = tennisDraftSchema.safeParse(body)
    if (!parsed.success) return invalidRecord(parsed.error)
    const row = parsed.data
    const detail = parseRecord(tennisMatchSchema, {
      matchId: row.id,
      playerAId: row.playerAId,
      playerBId: row.playerBId,
      winnerId: row.winnerId,
      bestOf: row.bestOf,
      score: row.score,
      ...(row.retired === undefined ? {} : { retired: row.retired }),
    })
    const stats = (row.stats ?? []).map((stat) =>
      parseRecord(tennisMatchStatsSchema, sameMatch(stat, row.id)),
    )
    oneEach(stats.map((stat) => stat.athleteId))
    return persistDraft(db, sport, row, actorId, mode, detail, stats, 'tennisMatchStats')
  }
  const parsed = footballDraftSchema.safeParse(body)
  if (!parsed.success) return invalidRecord(parsed.error)
  const row = parsed.data
  const detail = parseRecord(footballMatchSchema, {
    matchId: row.id,
    homeTeamId: row.homeTeamId,
    awayTeamId: row.awayTeamId,
    homeGoals: row.homeGoals,
    awayGoals: row.awayGoals,
  })
  const lines = (row.appearances ?? []).map((line) =>
    parseRecord(appearanceSchema, sameMatch(line, row.id)),
  )
  oneEach(lines.map((line) => line.athleteId))
  return persistDraft(db, sport, row, actorId, mode, detail, lines, 'appearance')
}
