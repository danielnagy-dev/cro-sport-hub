import {
  creatorKindSchema,
  httpsUrlSchema,
  idSchema,
  textSchema,
  timestampSchema,
} from '@cro-sport-hub/shared-types'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { CatalogError, parseRecord, type CatalogDb } from '../../catalog/errors.js'
import * as schema from '../../catalog/schema.js'

const { appearanceSources, sources } = schema

export const MISSING_APPEARANCE_MESSAGE = 'Expected an appearance id'

export const sourceWriteSchema = z.strictObject({
  id: idSchema,
  url: httpsUrlSchema,
  fetchedAt: timestampSchema,
  creatorKind: creatorKindSchema,
})

export const sourceSchema = z.strictObject({
  ...sourceWriteSchema.shape,
  createdAt: timestampSchema,
})
export type Source = z.infer<typeof sourceSchema>

export const attachAppearanceSourceSchema = z.strictObject({
  appearanceId: idSchema,
  sourceId: idSchema,
  fieldPath: textSchema(120).optional(),
  disagrees: z.boolean().optional(),
})

export const setDisagreementSchema = z.strictObject({
  disagrees: z.boolean(),
  fieldPath: textSchema(120).optional(),
})

export const appearanceSourceAttachmentSchema = z.strictObject({
  appearanceId: idSchema,
  sourceId: idSchema,
  url: httpsUrlSchema,
  fetchedAt: timestampSchema,
  creatorKind: creatorKindSchema,
  fieldPath: textSchema(120).optional(),
  disagrees: z.boolean(),
  createdAt: timestampSchema,
})
export type AppearanceSourceAttachment = z.infer<typeof appearanceSourceAttachmentSchema>

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
    throw error
  }
}

function asIsoOffset(value: string): string {
  const withT = value.includes('T') ? value : value.replace(' ', 'T')
  if (withT.endsWith('Z')) return withT.replace(/Z$/, '+00:00')
  return /[+-]\d{2}$/.test(withT) ? `${withT}:00` : withT
}

function linkKey(appearanceId: string, sourceId: string) {
  return and(
    eq(appearanceSources.appearanceId, appearanceId),
    eq(appearanceSources.sourceId, sourceId),
  )
}

function storedSource(row: typeof sources.$inferSelect): Source {
  return parseRecord(sourceSchema, {
    id: row.id,
    url: row.url,
    fetchedAt: asIsoOffset(row.fetchedAt),
    creatorKind: row.creatorKind,
    createdAt: asIsoOffset(row.createdAt),
  })
}

function storedAttachment(
  link: typeof appearanceSources.$inferSelect,
  source: typeof sources.$inferSelect,
): AppearanceSourceAttachment {
  return parseRecord(appearanceSourceAttachmentSchema, {
    appearanceId: link.appearanceId,
    sourceId: link.sourceId,
    url: source.url,
    fetchedAt: asIsoOffset(source.fetchedAt),
    creatorKind: source.creatorKind,
    ...(link.fieldPath === null ? {} : { fieldPath: link.fieldPath }),
    disagrees: link.disagrees,
    createdAt: asIsoOffset(source.createdAt),
  })
}

async function readAttachment(
  db: CatalogDb,
  appearanceId: string,
  sourceId: string,
): Promise<AppearanceSourceAttachment> {
  const row = (
    await db
      .select({ link: appearanceSources, source: sources })
      .from(appearanceSources)
      .innerJoin(sources, eq(appearanceSources.sourceId, sources.id))
      .where(linkKey(appearanceId, sourceId))
  )[0]
  if (row === undefined) throw new CatalogError('unknown-ref', 'Unknown appearance source')
  return storedAttachment(row.link, row.source)
}

export async function createSource(db: CatalogDb, value: unknown): Promise<Source> {
  const parsed = parseRecord(sourceWriteSchema, value)
  const now = asIsoOffset(new Date().toISOString())
  await writeRow(() =>
    db.insert(sources).values({
      id: parsed.id,
      url: parsed.url,
      fetchedAt: parsed.fetchedAt,
      creatorKind: parsed.creatorKind,
      createdAt: now,
    }),
  )
  const row = (await db.select().from(sources).where(eq(sources.id, parsed.id)))[0]
  if (row === undefined) throw new CatalogError('unknown-ref', 'Unknown source')
  return storedSource(row)
}

export async function attachAppearanceSource(
  db: CatalogDb,
  value: unknown,
): Promise<AppearanceSourceAttachment> {
  const parsed = parseRecord(attachAppearanceSourceSchema, value)
  await writeRow(() =>
    db.insert(appearanceSources).values({
      appearanceId: parsed.appearanceId,
      sourceId: parsed.sourceId,
      fieldPath: parsed.fieldPath ?? null,
      disagrees: parsed.disagrees ?? false,
    }),
  )
  return readAttachment(db, parsed.appearanceId, parsed.sourceId)
}

export async function setAppearanceSourceDisagreement(
  db: CatalogDb,
  appearanceId: string,
  sourceId: string,
  value: unknown,
): Promise<AppearanceSourceAttachment> {
  const parsed = parseRecord(setDisagreementSchema, value)
  const existing = await db
    .select({ appearanceId: appearanceSources.appearanceId })
    .from(appearanceSources)
    .where(linkKey(appearanceId, sourceId))
  if (existing[0] === undefined) throw new CatalogError('unknown-ref', 'Unknown appearance source')
  await writeRow(() =>
    db
      .update(appearanceSources)
      .set({ disagrees: parsed.disagrees, fieldPath: parsed.fieldPath ?? null })
      .where(linkKey(appearanceId, sourceId)),
  )
  return readAttachment(db, appearanceId, sourceId)
}

export async function listAppearanceSources(
  db: CatalogDb,
  appearanceId: string,
): Promise<AppearanceSourceAttachment[]> {
  if (!idSchema.safeParse(appearanceId).success) {
    throw new CatalogError('invalid', MISSING_APPEARANCE_MESSAGE)
  }
  const rows = await db
    .select({ link: appearanceSources, source: sources })
    .from(appearanceSources)
    .innerJoin(sources, eq(appearanceSources.sourceId, sources.id))
    .where(eq(appearanceSources.appearanceId, appearanceId))
    .orderBy(asc(sources.fetchedAt), asc(sources.id))
  return rows.map((row) => storedAttachment(row.link, row.source))
}
