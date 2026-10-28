import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  appearanceSchema,
  footballMatchSchema,
  idSchema,
  isoDateSchema,
  roundSchema,
  tennisMatchSchema,
  textSchema,
} from '@cro-sport-hub/shared-types'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { CatalogError, invalidRecord, parseRecord, type Catalog, type CatalogDb } from './errors.js'
import { readRecord, sportIdFor, writeRecord } from './records.js'
import * as schema from './schema.js'

const { appearances, footballMatches, importRuns, matches, tennisMatches } = schema

const headerSchema = z.strictObject({
  id: idSchema,
  sourceRef: textSchema(200),
  competitionId: idSchema,
  date: isoDateSchema,
  round: roundSchema,
  sport: z.enum(['tennis', 'football']),
})

type Header = z.output<typeof headerSchema>
type TennisDetail = z.output<typeof tennisMatchSchema>
type FootballDetail = z.output<typeof footballMatchSchema>
type AppearanceLine = z.output<typeof appearanceSchema>
type FixtureRow =
  | (Header & { sport: 'tennis'; detail: TennisDetail })
  | (Header & { sport: 'football'; detail: FootballDetail; appearances: AppearanceLine[] })
type Outcome = 'created' | 'updated' | 'skipped'

export type ImportRun = typeof importRuns.$inferSelect

const databases = new WeakMap<Catalog, CatalogDb>()
let runSequence = 0

/** Attaches the open database so `runImport` can write without a second pool. */
export function bindCatalog(catalog: Catalog, db: CatalogDb): void {
  databases.set(catalog, db)
}

export function readImportFixture(): unknown {
  const path = join(dirname(fileURLToPath(import.meta.url)), 'import-fixture.json')
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'))
  return value
}

function database(catalog: Catalog): CatalogDb {
  const db = databases.get(catalog)
  if (db === undefined) throw new CatalogError('unreachable', 'The catalog is closed')
  return db
}

function nextRunId(startedAt: string): string {
  runSequence += 1
  return `run-${startedAt.replaceAll(/\D/g, '')}-${String(runSequence).padStart(4, '0')}`
}

function detailBody(row: Record<string, unknown>, matchId: string): Record<string, unknown> {
  const body: Record<string, unknown> = { matchId }
  for (const [key, value] of Object.entries(row)) {
    if (key in headerSchema.shape || key === 'appearances') continue
    body[key] = value
  }
  return body
}

function withMatch(value: unknown, matchId: string): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value
  return { ...value, matchId }
}

function parseRow(value: unknown): FixtureRow {
  const record = z.record(z.string(), z.unknown()).safeParse(value)
  if (!record.success) return invalidRecord(record.error)
  const picked: Record<string, unknown> = {}
  for (const key of Object.keys(headerSchema.shape)) picked[key] = record.data[key]
  const header = headerSchema.safeParse(picked)
  if (!header.success) return invalidRecord(header.error)
  const body = detailBody(record.data, header.data.id)
  if (header.data.sport === 'tennis') {
    return { ...header.data, sport: 'tennis', detail: parseRecord(tennisMatchSchema, body) }
  }
  const lines = z
    .array(z.unknown())
    .max(50)
    .safeParse(record.data.appearances ?? [])
  if (!lines.success) return invalidRecord(lines.error)
  return {
    ...header.data,
    sport: 'football',
    detail: parseRecord(footballMatchSchema, body),
    appearances: lines.data.map((line) =>
      parseRecord(appearanceSchema, withMatch(line, header.data.id)),
    ),
  }
}

function pack(lines: readonly AppearanceLine[]): string {
  return lines
    .map(
      (line) =>
        `${line.athleteId}|${line.teamId}|${line.started}|${line.minutes}|${line.goals}|${line.assists}|${line.yellowCards}|${line.redCard}`,
    )
    .sort()
    .join('\n')
}

async function unchanged(db: CatalogDb, matchId: string, row: FixtureRow): Promise<boolean> {
  if (row.sport === 'tennis') {
    const stored = await readRecord(db, 'tennisMatch', matchId)
    if (stored === undefined || !('score' in stored)) {
      throw new CatalogError('unknown-ref', 'The tennis match is not in the catalog')
    }
    return JSON.stringify(stored.score) === JSON.stringify(row.detail.score)
  }
  const stored = await readRecord(db, 'footballMatch', matchId)
  if (stored === undefined || !('homeGoals' in stored)) {
    throw new CatalogError('unknown-ref', 'The football match is not in the catalog')
  }
  if (stored.homeGoals !== row.detail.homeGoals || stored.awayGoals !== row.detail.awayGoals) {
    return false
  }
  const lines = await db.select().from(appearances).where(eq(appearances.matchId, matchId))
  return pack(lines) === pack(row.appearances)
}

async function writeImport(
  db: CatalogDb,
  matchId: string,
  row: FixtureRow,
  actorId: string,
  creating: boolean,
): Promise<void> {
  const sportId = creating ? await sportIdFor(db, row.sport) : undefined
  await db.transaction(async (tx) => {
    const database = tx as unknown as CatalogDb
    if (creating) {
      await writeRecord(database, 'match', {
        id: row.id,
        sportId,
        competitionId: row.competitionId,
        date: row.date,
        round: row.round,
        status: 'draft',
        source: 'import',
        sourceRef: row.sourceRef,
        createdBy: actorId,
      })
      if (row.sport === 'tennis') {
        await writeRecord(database, 'tennisMatch', row.detail)
        return
      }
      await writeRecord(database, 'footballMatch', row.detail)
    } else if (row.sport === 'tennis') {
      await database
        .update(tennisMatches)
        .set({
          winnerId: row.detail.winnerId,
          score: row.detail.score,
          retired: row.detail.retired ?? null,
        })
        .where(eq(tennisMatches.matchId, matchId))
      return
    } else {
      await database
        .update(footballMatches)
        .set({ homeGoals: row.detail.homeGoals, awayGoals: row.detail.awayGoals })
        .where(eq(footballMatches.matchId, matchId))
      await database.delete(appearances).where(eq(appearances.matchId, matchId))
    }
    for (const line of row.appearances) {
      await writeRecord(database, 'appearance', { ...line, matchId })
    }
  })
}

async function applyRow(db: CatalogDb, value: unknown, actorId: string): Promise<Outcome> {
  const row = parseRow(value)
  const existing = await db
    .select({ id: matches.id, status: matches.status, sportSlug: matches.sportSlug })
    .from(matches)
    .where(and(eq(matches.source, 'import'), eq(matches.sourceRef, row.sourceRef)))
  const stored = existing[0]
  if (stored === undefined) {
    await writeImport(db, row.id, row, actorId, true)
    return 'created'
  }
  if (stored.status !== 'draft') return 'skipped'
  if (stored.sportSlug !== row.sport) {
    throw new CatalogError('invalid', 'The import source ref is a different sport')
  }
  if (await unchanged(db, stored.id, row)) return 'skipped'
  await writeImport(db, stored.id, row, actorId, false)
  return 'updated'
}

export async function runImport(
  catalog: Catalog,
  fixture: unknown,
  actorId: string,
): Promise<ImportRun> {
  const db = database(catalog)
  const startedAt = new Date().toISOString()
  const parsed = z.strictObject({ matches: z.array(z.unknown()) }).safeParse(fixture)
  if (!parsed.success) return invalidRecord(parsed.error)
  const messages: string[] = []
  const counts: Record<Outcome, number> = { created: 0, updated: 0, skipped: 0 }
  for (const value of parsed.data.matches) {
    try {
      counts[await applyRow(db, value, actorId)] += 1
    } catch (error) {
      if (!(error instanceof CatalogError)) throw error
      const text = error.issues?.map((issue) => issue.message).join('; ')
      messages.push(text === undefined || text.length === 0 ? error.message : text)
    }
  }
  const run: ImportRun = {
    id: nextRunId(startedAt),
    startedAt,
    finishedAt: new Date().toISOString(),
    createdCount: counts.created,
    updatedCount: counts.updated,
    skippedCount: counts.skipped,
    error: messages.join('; '),
  }
  await db.insert(importRuns).values(run)
  return run
}

export async function listImportRuns(catalog: Catalog): Promise<ImportRun[]> {
  return database(catalog)
    .select()
    .from(importRuns)
    .orderBy(desc(importRuns.startedAt), desc(importRuns.id))
}
