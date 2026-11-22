import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { describe, expect, it } from 'vite-plus/test'
import { openCatalog } from './connection.js'
import { splitSqlStatements, sqlMigrationStatements } from './migrations.js'
import * as schema from './schema.js'

const catalogDir = dirname(fileURLToPath(import.meta.url))

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

  it('keeps dollar-quoted bodies as one statement', () => {
    expect(
      splitSqlStatements(`
DO $rename$
BEGIN
  IF true THEN
    ALTER TABLE appearances RENAME TO match_appearances;
  END IF;
END
$rename$;
SELECT 1;
`),
    ).toEqual([
      `DO $rename$
BEGIN
  IF true THEN
    ALTER TABLE appearances RENAME TO match_appearances;
  END IF;
END
$rename$`,
      'SELECT 1',
    ])
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

      const matchAppearances = await client.query(
        "SELECT tablename FROM pg_tables WHERE tablename = 'match_appearances'",
      )
      expect(matchAppearances.rows).toHaveLength(1)
      const appearanceCols = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'appearances' AND column_name = 'opponent_label'",
      )
      expect(appearanceCols.rows).toHaveLength(1)
      const legacyCols = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'match_appearances' AND column_name = 'match_id'",
      )
      expect(legacyCols.rows).toHaveLength(1)
      const legacyShapeGone = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'appearances' AND column_name = 'match_id'",
      )
      expect(legacyShapeGone.rows).toHaveLength(0)

      const nationalTeams = await client.query(
        "SELECT tablename FROM pg_tables WHERE tablename = 'national_teams'",
      )
      expect(nationalTeams.rows).toHaveLength(1)
      const lineupEntries = await client.query(
        "SELECT tablename FROM pg_tables WHERE tablename = 'lineup_entries'",
      )
      expect(lineupEntries.rows).toHaveLength(1)

      const basketball = await client.query(
        "SELECT id FROM sports WHERE id = 'sport-basketball' AND slug = 'basketball'",
      )
      expect(basketball.rows).toHaveLength(1)
      const clubName = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'club_name'",
      )
      expect(clubName.rows).toHaveLength(1)

      const publishTables = await client.query(
        `SELECT tablename FROM pg_tables
         WHERE tablename IN (
           'publish_slot_clocks', 'publish_slots', 'network_posts',
           'sources', 'appearance_sources'
         )
         ORDER BY tablename`,
      )
      expect(publishTables.rows.map((row) => (row as { tablename: string }).tablename)).toEqual([
        'appearance_sources',
        'network_posts',
        'publish_slot_clocks',
        'publish_slots',
        'sources',
      ])

      const clocks = await client.query(
        `SELECT id, clock_time::text AS clock_time, sort_order
         FROM publish_slot_clocks
         WHERE id IN ('slot-clock-1530', 'slot-clock-2200')
         ORDER BY sort_order`,
      )
      expect(clocks.rows).toEqual([
        { id: 'slot-clock-1530', clock_time: '15:30:00', sort_order: 1 },
        { id: 'slot-clock-2200', clock_time: '22:00:00', sort_order: 2 },
      ])

      const slotStatus = await client.query(
        `SELECT pg_get_constraintdef(oid) AS def
         FROM pg_constraint
         WHERE conname = 'publish_slots_status'`,
      )
      expect((slotStatus.rows[0] as { def: string }).def).toContain('waiting_for_data')
      const networkStatus = await client.query(
        `SELECT pg_get_constraintdef(oid) AS def
         FROM pg_constraint
         WHERE conname = 'network_posts_status'`,
      )
      expect((networkStatus.rows[0] as { def: string }).def).toContain('ready_for_review')
      expect((networkStatus.rows[0] as { def: string }).def).not.toContain('waiting_for_data')

      const galleryTables = await client.query(
        `SELECT tablename FROM pg_tables
         WHERE tablename IN ('galleries', 'gallery_slides')
         ORDER BY tablename`,
      )
      expect(galleryTables.rows).toHaveLength(0)
    } finally {
      await catalog.close()
    }
  })

  it('reopens the catalog after 0011 without failing', async () => {
    const client = new PGlite()
    const db = drizzle(client, { schema })
    try {
      const first = await openCatalog(db)
      await first.close()
      const second = await openCatalog(db, { close: () => client.close() })
      try {
        const tables = await client.query(
          `SELECT tablename FROM pg_tables
           WHERE tablename IN (
             'match_appearances', 'appearances', 'national_teams', 'lineup_entries',
             'publish_slot_clocks', 'publish_slots', 'network_posts',
             'sources', 'appearance_sources'
           )
           ORDER BY tablename`,
        )
        expect(tables.rows.map((row) => (row as { tablename: string }).tablename)).toEqual([
          'appearance_sources',
          'appearances',
          'lineup_entries',
          'match_appearances',
          'national_teams',
          'network_posts',
          'publish_slot_clocks',
          'publish_slots',
          'sources',
        ])
        const clocks = await client.query(
          "SELECT count(*)::int AS n FROM publish_slot_clocks WHERE id IN ('slot-clock-1530', 'slot-clock-2200')",
        )
        expect((clocks.rows[0] as { n: number }).n).toBe(2)
        const galleryTables = await client.query(
          `SELECT tablename FROM pg_tables
           WHERE tablename IN ('galleries', 'gallery_slides')
           ORDER BY tablename`,
        )
        expect(galleryTables.rows).toHaveLength(0)
      } finally {
        await second.close()
      }
    } catch (error) {
      await client.close()
      throw error
    }
  })

  it('loads 0009, 0010, and 0011 statements from the catalog directory', () => {
    const statements = sqlMigrationStatements(catalogDir)
    expect(statements.some((statement) => statement.startsWith('DO $rename$'))).toBe(true)
    expect(
      statements.some((statement) =>
        statement.includes('CREATE TABLE IF NOT EXISTS national_teams'),
      ),
    ).toBe(true)
    expect(
      statements.some((statement) =>
        statement.includes('CREATE TABLE IF NOT EXISTS publish_slot_clocks'),
      ),
    ).toBe(true)
    expect(
      statements.some((statement) =>
        statement.includes('CREATE TABLE IF NOT EXISTS network_posts'),
      ),
    ).toBe(true)
    expect(
      statements.some((statement) => statement === 'DROP TABLE IF EXISTS gallery_slides'),
    ).toBe(true)
    expect(statements.some((statement) => statement === 'DROP TABLE IF EXISTS galleries')).toBe(
      true,
    )
  })
})
