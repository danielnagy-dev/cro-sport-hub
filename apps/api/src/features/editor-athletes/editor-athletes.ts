import { type SportSlug } from '@cro-sport-hub/shared-types'
import { and, asc, eq, ilike, or } from 'drizzle-orm'
import { CatalogError, parseRecord, type CatalogDb } from '../../catalog/errors.js'
import * as schema from '../../catalog/schema.js'
import {
  editorAthleteSchema,
  type EditorAthlete,
  type EditorAthleteListQuery,
} from './editor-athlete.js'

const { athletes, sports } = schema

function sqlState(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  if ('code' in error && typeof error.code === 'string' && /^[0-9A-Z]{5}$/.test(error.code)) {
    return error.code
  }
  return 'cause' in error ? sqlState(error.cause) : undefined
}

function storedAthlete(row: typeof athletes.$inferSelect): EditorAthlete {
  return parseRecord(editorAthleteSchema, {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sportId: row.sportId,
    country: row.country,
    ...(row.birthYear === null ? {} : { birthYear: row.birthYear }),
    ...(row.position === null ? {} : { position: row.position }),
    ...(row.photoUrl === null ? {} : { photoUrl: row.photoUrl }),
    ...(row.clubName === null ? {} : { clubName: row.clubName }),
  })
}

async function resolveSportSlug(db: CatalogDb, sportId: string): Promise<SportSlug> {
  const rows = await db.select({ slug: sports.slug }).from(sports).where(eq(sports.id, sportId))
  const slug = rows[0]?.slug
  if (slug === 'tennis' || slug === 'football' || slug === 'basketball') return slug
  throw new CatalogError('unknown-ref', 'The sport is not in the catalog')
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
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

function rowValues(athlete: EditorAthlete, sportSlug: SportSlug) {
  return {
    id: athlete.id,
    slug: athlete.slug,
    name: athlete.name,
    sportId: athlete.sportId,
    sportSlug,
    country: athlete.country,
    birthYear: athlete.birthYear ?? null,
    position: athlete.position ?? null,
    photoUrl: athlete.photoUrl ?? null,
    clubName: athlete.clubName ?? null,
  }
}

export async function listEditorAthletes(
  db: CatalogDb,
  query: EditorAthleteListQuery,
): Promise<EditorAthlete[]> {
  const pattern = query.q === undefined ? undefined : `%${escapeLike(query.q)}%`
  const nameOrSlug =
    pattern === undefined
      ? undefined
      : or(ilike(athletes.name, pattern), ilike(athletes.slug, pattern))
  const rows = await db
    .select()
    .from(athletes)
    .where(
      nameOrSlug === undefined
        ? eq(athletes.sportSlug, query.sport)
        : and(eq(athletes.sportSlug, query.sport), nameOrSlug),
    )
    .orderBy(asc(athletes.name))
  return rows.map(storedAthlete)
}

export async function createAthlete(db: CatalogDb, value: unknown): Promise<EditorAthlete> {
  const athlete = parseRecord(editorAthleteSchema, value)
  const sportSlug = await resolveSportSlug(db, athlete.sportId)
  await writeRow(() => db.insert(athletes).values(rowValues(athlete, sportSlug)))
  return athlete
}

export async function updateAthlete(
  db: CatalogDb,
  id: string,
  value: unknown,
): Promise<EditorAthlete> {
  const athlete = parseRecord(editorAthleteSchema, value)
  if (athlete.id !== id) {
    throw new CatalogError('invalid', 'The athlete id is the one in the path')
  }
  const existing = await db.select({ id: athletes.id }).from(athletes).where(eq(athletes.id, id))
  if (existing.length === 0) throw new CatalogError('unknown-ref', 'Unknown athlete')
  const sportSlug = await resolveSportSlug(db, athlete.sportId)
  await writeRow(() =>
    db.update(athletes).set(rowValues(athlete, sportSlug)).where(eq(athletes.id, id)),
  )
  return athlete
}
