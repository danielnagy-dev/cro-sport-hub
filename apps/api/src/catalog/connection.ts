import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { bindCatalog } from './import-runs.js'
import { CatalogError, type Catalog, type CatalogDb, type CatalogErrorCode } from './errors.js'
import { readRecord, writeRecord } from './records.js'
import { sqlMigrationStatements } from './migrations.js'
import * as schema from './schema.js'

const migrationDir = dirname(fileURLToPath(import.meta.url))

const catalogDatabases = new WeakMap<Catalog, CatalogDb>()

/** The Drizzle handle for one `openCatalog` session. */
export function catalogDb(catalog: Catalog): CatalogDb {
  const db = catalogDatabases.get(catalog)
  if (db === undefined) throw new Error('The catalog handle is not from openCatalog')
  return db
}

async function release(close: (() => Promise<void>) | undefined): Promise<void> {
  await close?.().catch(() => undefined)
}

function failed(code: CatalogErrorCode, message: string, cause: unknown): CatalogError {
  return new CatalogError(code, message, undefined, { cause })
}

export async function openCatalog(
  db: CatalogDb,
  options?: { close?: () => Promise<void> },
): Promise<Catalog> {
  try {
    await db.execute(sql.raw('SELECT 1'))
  } catch (error) {
    await release(options?.close)
    throw failed('unreachable', 'Postgres is unreachable', error)
  }
  try {
    for (const statement of sqlMigrationStatements(migrationDir)) {
      await db.execute(sql.raw(statement))
    }
  } catch (error) {
    await release(options?.close)
    if (error instanceof CatalogError) throw error
    throw failed('migration', 'The catalog migration failed', error)
  }
  let closing: Promise<void> | undefined
  const catalog: Catalog = {
    write: (kind, value) => writeRecord(db, kind, value),
    read: (kind, key) => readRecord(db, kind, key),
    close: () => {
      closing ??= options?.close?.() ?? Promise.resolve()
      return closing
    },
  }
  bindCatalog(catalog, db)
  catalogDatabases.set(catalog, db)
  return catalog
}

export async function openPostgresCatalog(databaseUrl: string): Promise<Catalog> {
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 500,
    query_timeout: 500,
    max: 1,
  })
  pool.on('error', () => undefined)
  try {
    await pool.query('SELECT 1')
  } catch (error) {
    await pool.end().catch(() => undefined)
    throw failed('unreachable', 'Postgres is unreachable', error)
  }
  return openCatalog(drizzlePg(pool, { schema }), { close: () => pool.end() })
}
