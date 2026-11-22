import {
  appearanceStatusSchema,
  creatorKindSchema,
  idSchema,
  isoDateSchema,
  sportSlugSchema,
  textSchema,
  timestampSchema,
} from '@cro-sport-hub/shared-types'
import { and, asc, eq, gte, inArray, lte, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { CatalogError, parseRecord, type CatalogDb } from '../../catalog/errors.js'
import * as schema from '../../catalog/schema.js'

const { appearances, lineupEntries } = schema

function refineParticipant(
  value: {
    sportSlug: z.infer<typeof sportSlugSchema>
    athleteId?: string
    athleteSport?: z.infer<typeof sportSlugSchema>
    nationalTeamId?: string
  },
  ctx: z.RefinementCtx,
): void {
  const hasAthlete = value.athleteId !== undefined
  if (hasAthlete === (value.nationalTeamId !== undefined)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Exactly one of athleteId or nationalTeamId is required',
      path: ['athleteId'],
    })
  }
  if (hasAthlete !== (value.athleteSport !== undefined)) {
    ctx.addIssue({
      code: 'custom',
      message: 'athleteSport is required with athleteId only',
      path: ['athleteSport'],
    })
  } else if (hasAthlete && value.athleteSport !== value.sportSlug) {
    ctx.addIssue({
      code: 'custom',
      message: 'athleteSport must match sportSlug',
      path: ['athleteSport'],
    })
  }
}

const APPEARANCE_BASE = {
  id: idSchema,
  sportId: idSchema,
  sportSlug: sportSlugSchema,
  competitionId: idSchema,
  athleteId: idSchema.optional(),
  athleteSport: sportSlugSchema.optional(),
  nationalTeamId: idSchema.optional(),
  opponentLabel: textSchema(120),
  startsAt: timestampSchema,
  endsAt: timestampSchema.optional(),
  status: appearanceStatusSchema,
  result: z.record(z.string(), z.unknown()).optional(),
  creatorKind: creatorKindSchema,
} as const

export const appearanceWriteSchema = z.strictObject(APPEARANCE_BASE).superRefine(refineParticipant)
export type AppearanceWrite = z.infer<typeof appearanceWriteSchema>
export const appearanceSchema = z
  .strictObject({ ...APPEARANCE_BASE, createdAt: timestampSchema, updatedAt: timestampSchema })
  .superRefine(refineParticipant)
export type Appearance = z.infer<typeof appearanceSchema>

export const appearanceListQuerySchema = z
  .strictObject({
    day: isoDateSchema.optional(),
    sportSlug: sportSlugSchema.optional(),
    athleteId: idSchema.optional(),
    nationalTeamId: idSchema.optional(),
  })
  .refine((value) => value.day || value.sportSlug || value.athleteId || value.nationalTeamId, {
    message: 'At least one list filter is required',
    path: ['day'],
  })
export type AppearanceListQuery = z.infer<typeof appearanceListQuerySchema>

function sqlState(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  if ('code' in error && typeof error.code === 'string' && /^[0-9A-Z]{5}$/.test(error.code)) {
    return error.code
  }
  return 'cause' in error ? sqlState(error.cause) : undefined
}

async function writeRow(run: () => Promise<unknown>): Promise<void> {
  try {
    await run()
  } catch (error) {
    if (sqlState(error) === '23505')
      throw new CatalogError('conflict', 'That record is already stored')
    if (sqlState(error) === '23503') throw new CatalogError('unknown-ref', 'Unknown row')
    if (sqlState(error) === '23514') {
      throw new CatalogError('invalid', 'The appearance participant rule was violated')
    }
    throw error
  }
}

function asIsoOffset(value: string): string {
  const withT = value.includes('T') ? value : value.replace(' ', 'T')
  if (withT.endsWith('Z')) return withT.replace(/Z$/, '+00:00')
  return /[+-]\d{2}$/.test(withT) ? `${withT}:00` : withT
}

function appearanceRow(value: AppearanceWrite, createdAt: string, updatedAt: string) {
  return {
    id: value.id,
    sportId: value.sportId,
    sportSlug: value.sportSlug,
    competitionId: value.competitionId,
    athleteId: value.athleteId ?? null,
    athleteSport: value.athleteSport ?? null,
    nationalTeamId: value.nationalTeamId ?? null,
    opponentLabel: value.opponentLabel,
    startsAt: value.startsAt,
    endsAt: value.endsAt ?? null,
    status: value.status,
    result: value.result ?? null,
    creatorKind: value.creatorKind,
    createdAt,
    updatedAt,
  }
}

function storedAppearance(row: typeof appearances.$inferSelect): Appearance {
  return parseRecord(appearanceSchema, {
    id: row.id,
    sportId: row.sportId,
    sportSlug: row.sportSlug,
    competitionId: row.competitionId,
    ...(row.athleteId === null ? {} : { athleteId: row.athleteId }),
    ...(row.athleteSport === null ? {} : { athleteSport: row.athleteSport }),
    ...(row.nationalTeamId === null ? {} : { nationalTeamId: row.nationalTeamId }),
    opponentLabel: row.opponentLabel,
    startsAt: asIsoOffset(row.startsAt),
    ...(row.endsAt === null ? {} : { endsAt: asIsoOffset(row.endsAt) }),
    status: row.status,
    ...(row.result == null ? {} : { result: row.result as Record<string, unknown> }),
    creatorKind: row.creatorKind,
    createdAt: asIsoOffset(row.createdAt),
    updatedAt: asIsoOffset(row.updatedAt),
  })
}

export async function listAppearances(
  db: CatalogDb,
  query: AppearanceListQuery,
): Promise<Appearance[]> {
  const filters: SQL[] = []
  if (query.day !== undefined) {
    filters.push(
      gte(appearances.startsAt, `${query.day}T00:00:00.000Z`),
      lte(appearances.startsAt, `${query.day}T23:59:59.999Z`),
    )
  }
  if (query.sportSlug !== undefined) filters.push(eq(appearances.sportSlug, query.sportSlug))
  if (query.nationalTeamId !== undefined) {
    filters.push(eq(appearances.nationalTeamId, query.nationalTeamId))
  }
  if (query.athleteId !== undefined) {
    const [asParticipant, asLineup] = await Promise.all([
      db
        .select({ id: appearances.id })
        .from(appearances)
        .where(eq(appearances.athleteId, query.athleteId)),
      db
        .select({ id: lineupEntries.appearanceId })
        .from(lineupEntries)
        .where(eq(lineupEntries.athleteId, query.athleteId)),
    ])
    const ids = [...new Set([...asParticipant.map((r) => r.id), ...asLineup.map((r) => r.id)])]
    if (ids.length === 0) return []
    filters.push(inArray(appearances.id, ids))
  }
  const rows = await db
    .select()
    .from(appearances)
    .where(and(...filters))
    .orderBy(asc(appearances.startsAt), asc(appearances.id))
  return rows.map(storedAppearance)
}

export async function createAppearance(db: CatalogDb, value: unknown): Promise<Appearance> {
  const parsed = parseRecord(appearanceWriteSchema, value)
  const now = asIsoOffset(new Date().toISOString())
  await writeRow(() => db.insert(appearances).values(appearanceRow(parsed, now, now)))
  const row = (await db.select().from(appearances).where(eq(appearances.id, parsed.id)))[0]
  if (row === undefined) throw new CatalogError('unknown-ref', 'Unknown appearance')
  return storedAppearance(row)
}

export async function updateAppearance(
  db: CatalogDb,
  id: string,
  value: unknown,
): Promise<Appearance> {
  const parsed = parseRecord(appearanceWriteSchema, value)
  if (parsed.id !== id) {
    throw new CatalogError('invalid', 'The appearance id is the one in the path')
  }
  const existing = await db
    .select({ id: appearances.id, createdAt: appearances.createdAt })
    .from(appearances)
    .where(eq(appearances.id, id))
  const current = existing[0]
  if (current === undefined) throw new CatalogError('unknown-ref', 'Unknown appearance')
  await writeRow(() =>
    db
      .update(appearances)
      .set(
        appearanceRow(
          parsed,
          asIsoOffset(current.createdAt),
          asIsoOffset(new Date().toISOString()),
        ),
      )
      .where(eq(appearances.id, id)),
  )
  const updated = (await db.select().from(appearances).where(eq(appearances.id, id)))[0]
  if (updated === undefined) throw new CatalogError('unknown-ref', 'Unknown appearance')
  return storedAppearance(updated)
}
