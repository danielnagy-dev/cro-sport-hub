import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { describe, expect, it } from 'vite-plus/test'
import { openCatalog, type Catalog } from './catalog.js'
import * as schema from './schema.js'
import { seedCatalog, seedFootballAthletes, seedRows, seedTennisAthletes } from './seed.js'

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
      const packed = JSON.stringify(seedRows)
      expect(packed).not.toContain('photoUrl')
      expect(packed).not.toContain('crestUrl')
      expect(packed).not.toContain('password')
      for (const row of seedRows) {
        expect(await catalog.read(row.kind, row.key)).toEqual(row.value)
      }
    })
  })

  it('loads a second time without duplicates or errors', async () => {
    await withMemory(async (catalog) => {
      await seedCatalog(catalog)
      await seedCatalog(catalog)
      for (const row of seedRows) {
        expect(await catalog.read(row.kind, row.key)).toEqual(row.value)
      }
    })
  })
})
