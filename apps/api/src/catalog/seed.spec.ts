import { PGlite } from '@electric-sql/pglite'
import { count, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { describe, expect, it } from 'vite-plus/test'
import { catalogDb, openCatalog, type Catalog } from './catalog.js'
import * as schema from './schema.js'
import {
  seedBasketballAthletes,
  seedCatalog,
  seedFootballAthletes,
  seedRows,
  seedTennisAthletes,
} from './seed.js'

async function withMemory(check: (catalog: Catalog) => Promise<void>): Promise<void> {
  const client = new PGlite()
  const catalog = await openCatalog(drizzle(client, { schema }), {
    close: () => client.close(),
  })
  try {
    await check(catalog)
  } finally {
    await catalog.close()
  }
}

describe('catalog seed', () => {
  it('round-trips the sample through the catalog read path', async () => {
    await withMemory(async (catalog) => {
      await seedCatalog(catalog)
      expect(seedTennisAthletes.length).toBeGreaterThan(0)
      expect(seedTennisAthletes.length).toBeLessThanOrEqual(10)
      expect(seedFootballAthletes.length).toBeGreaterThan(0)
      expect(seedFootballAthletes.length).toBeLessThanOrEqual(10)
      expect(seedBasketballAthletes.length).toBeGreaterThan(0)
      expect(seedBasketballAthletes.length).toBeLessThanOrEqual(10)
      const packed = JSON.stringify(seedRows)
      expect(packed).not.toContain('photoUrl')
      expect(packed).not.toContain('crestUrl')
      expect(packed).not.toContain('password')
      for (const row of seedRows) {
        expect(await catalog.read(row.kind, row.key)).toEqual(row.value)
      }
    })
  })

  it('loads tennis, football, and basketball editorial rows plus a publish slot', async () => {
    await withMemory(async (catalog) => {
      await seedCatalog(catalog)
      const db = catalogDb(catalog)

      const athleteSports = await db
        .selectDistinct({ sportSlug: schema.athletes.sportSlug })
        .from(schema.athletes)
      expect(athleteSports.map((row) => row.sportSlug).sort()).toEqual([
        'basketball',
        'football',
        'tennis',
      ])

      const appearanceSports = await db
        .selectDistinct({ sportSlug: schema.appearances.sportSlug })
        .from(schema.appearances)
      expect(appearanceSports.map((row) => row.sportSlug).sort()).toEqual([
        'basketball',
        'football',
        'tennis',
      ])

      const nationalTeams = await db.select().from(schema.nationalTeams)
      expect(nationalTeams.length).toBeGreaterThanOrEqual(1)

      const lineups = await db.select().from(schema.lineupEntries)
      expect(lineups.length).toBeGreaterThanOrEqual(1)

      const slots = await db.select().from(schema.publishSlots)
      expect(slots.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('loads a second time without duplicates or errors', async () => {
    await withMemory(async (catalog) => {
      await seedCatalog(catalog)
      await seedCatalog(catalog)
      for (const row of seedRows) {
        expect(await catalog.read(row.kind, row.key)).toEqual(row.value)
      }
      const db = catalogDb(catalog)
      const appearanceCount = await db.select({ value: count() }).from(schema.appearances)
      const slotCount = await db.select({ value: count() }).from(schema.publishSlots)
      const lineupCount = await db.select({ value: count() }).from(schema.lineupEntries)
      expect(appearanceCount[0]?.value).toBeGreaterThanOrEqual(3)
      expect(slotCount[0]?.value).toBeGreaterThanOrEqual(1)
      expect(lineupCount[0]?.value).toBeGreaterThanOrEqual(1)

      const tennisAppearance = await db
        .select()
        .from(schema.appearances)
        .where(eq(schema.appearances.id, 'appearance-sample-tennis'))
      expect(tennisAppearance).toHaveLength(1)
    })
  })
})
