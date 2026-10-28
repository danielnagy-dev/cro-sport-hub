import { competitionSchema, type Competition } from '@cro-sport-hub/shared-types'
import { asc, eq } from 'drizzle-orm'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'
import { CatalogError, openCatalog, type Catalog } from './catalog/catalog.js'
import * as schema from './catalog/schema.js'

const { competitions, matches } = schema

type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>

export type CompetitionAdmin = {
  list(): Promise<Competition[]>
  create(body: unknown): Promise<Competition>
  update(id: string, body: unknown): Promise<Competition>
  remove(id: string): Promise<void>
}

export type CompetitionSession = {
  admin: CompetitionAdmin
  close(): Promise<void>
}

function requireCompetition(value: unknown): Competition {
  const parsed = competitionSchema.safeParse(value)
  if (parsed.success) return parsed.data
  throw new CatalogError(
    'invalid',
    'The record does not match the shared schema',
    parsed.error.issues.map((issue) => ({ path: issue.path.map(String), message: issue.message })),
    { cause: parsed.error },
  )
}

async function stored(catalog: Catalog, id: string): Promise<Competition> {
  return requireCompetition(await catalog.read('competition', id))
}

/** Same message `catalog.write` raises when the sport foreign key misses. */
async function assertSport(catalog: Catalog, sportId: string): Promise<void> {
  if ((await catalog.read('sport', sportId)) === undefined) {
    throw new CatalogError('unknown-ref', 'Unknown row')
  }
}

function competitionAdmin(db: CatalogDb, catalog: Catalog): CompetitionAdmin {
  return {
    async list() {
      const rows = await db.select().from(competitions).orderBy(asc(competitions.name))
      return rows.map((row) => requireCompetition(row))
    },
    async create(body) {
      await catalog.write('competition', body)
      return stored(catalog, requireCompetition(body).id)
    },
    async update(id, body) {
      const row = requireCompetition(body)
      if (row.id !== id) {
        throw new CatalogError('invalid', 'The competition id is the one in the path')
      }
      if ((await catalog.read('competition', id)) === undefined) {
        throw new CatalogError('unknown-ref', 'Unknown competition')
      }
      await assertSport(catalog, row.sportId)
      await db
        .update(competitions)
        .set({ sportId: row.sportId, name: row.name, season: row.season, level: row.level })
        .where(eq(competitions.id, id))
      return stored(catalog, id)
    },
    async remove(id) {
      if ((await catalog.read('competition', id)) === undefined) {
        throw new CatalogError('unknown-ref', 'Unknown competition')
      }
      const used = await db
        .select({ id: matches.id })
        .from(matches)
        .where(eq(matches.competitionId, id))
        .limit(1)
      if (used.length > 0) throw new CatalogError('conflict', 'Competition is in use')
      await db.delete(competitions).where(eq(competitions.id, id))
    },
  }
}

export async function competitionSession(
  db: CatalogDb,
  options?: { close?: () => Promise<void> },
): Promise<CompetitionSession> {
  const catalog = await openCatalog(db, options)
  return { admin: competitionAdmin(db, catalog), close: () => catalog.close() }
}

export async function openCompetitionSession(databaseUrl: string): Promise<CompetitionSession> {
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 500,
    query_timeout: 500,
    max: 1,
  })
  pool.on('error', () => undefined)
  return competitionSession(drizzlePg(pool, { schema }), { close: () => pool.end() })
}
