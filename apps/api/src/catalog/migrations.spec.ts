import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { describe, expect, it } from 'vite-plus/test'
import { openCatalog } from './connection.js'
import { sqlMigrationStatements } from './migrations.js'
import * as schema from './schema.js'

describe('catalog migrations', () => {
  it('sorts sql files with localeCompare en and ignores other files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cro-migrations-'))
    try {
      writeFileSync(join(dir, '0002_second.sql'), 'SELECT 2;')
      writeFileSync(join(dir, '0001_first.sql'), 'CREATE TABLE migration_order_probe (n integer);')
      writeFileSync(join(dir, 'notes.txt'), 'not sql')
      writeFileSync(join(dir, 'helper.spec.ts'), 'export {}')

      expect(sqlMigrationStatements(dir)).toEqual([
        'CREATE TABLE migration_order_probe (n integer)',
        'SELECT 2',
      ])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('applies statements from a temporary directory without editing the loader', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cro-migrations-'))
    try {
      writeFileSync(
        join(dir, '0001_probe.sql'),
        'CREATE TABLE temp_migration_applied (id text PRIMARY KEY);',
      )
      const client = new PGlite()
      const db = drizzle(client)
      try {
        for (const statement of sqlMigrationStatements(dir)) {
          await db.execute(sql.raw(statement))
        }
        const result = await client.query(
          "SELECT tablename FROM pg_tables WHERE tablename = 'temp_migration_applied'",
        )
        expect(result.rows).toHaveLength(1)
      } finally {
        await client.close()
      }
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('runs every shipped migration on PGLite', async () => {
    const client = new PGlite()
    const catalog = await openCatalog(drizzle(client, { schema }), {
      close: () => client.close(),
    })
    try {
      const index = await client.query(
        "SELECT indexname FROM pg_indexes WHERE indexname = 'matches_sport_status_date'",
      )
      expect(index.rows).toHaveLength(1)

      const passwordHash = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash'",
      )
      expect(passwordHash.rows).toHaveLength(1)

      const importRuns = await client.query(
        "SELECT tablename FROM pg_tables WHERE tablename = 'import_runs'",
      )
      expect(importRuns.rows).toHaveLength(1)
    } finally {
      await catalog.close()
    }
  })
})
