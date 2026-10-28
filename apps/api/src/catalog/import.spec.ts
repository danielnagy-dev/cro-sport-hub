import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { describe, expect, it } from 'vite-plus/test'
import { openCatalog, catalogDb, readImportFixture, runImport, type Catalog } from './catalog.js'
import { seedCatalog } from './seed.js'
import { listPublishedMatches } from './published-matches.js'
import * as schema from './schema.js'

const tiebreak = 'A 7-6 set needs the tiebreak points scored by the player who lost the set'
const players = {
  playerAId: 'sample-player-a',
  playerBId: 'sample-player-b',
  winnerId: 'sample-player-a',
  bestOf: 3,
  retired: false,
}

function sets(left: number, right: number): number[][] {
  return [
    [6, left],
    [6, right],
  ]
}

function shipped(): { matches: Array<Record<string, unknown>> } {
  return structuredClone(readImportFixture()) as { matches: Array<Record<string, unknown>> }
}

function rowAt(fixture: { matches: Array<Record<string, unknown>> }, index: number) {
  const row = fixture.matches[index]
  if (row === undefined) throw new Error('The fixture is missing that match')
  return row
}

function tennis(id: string, sourceRef: string, score: number[][]) {
  return {
    sport: 'tennis',
    id,
    sourceRef,
    competitionId: 'comp-sample-cup',
    date: '2026-10-12',
    round: 'Quarter-final',
    ...players,
    score,
  }
}

async function seeded(): Promise<Catalog> {
  const client = new PGlite()
  const catalog = await openCatalog(drizzle(client, { schema }), { close: () => client.close() })
  await seedCatalog(catalog)
  return catalog
}

async function expectRun(
  catalog: Catalog,
  fixture: unknown,
  created: number,
  updated: number,
  skipped: number,
  error = '',
) {
  expect(await runImport(catalog, fixture, 'admin-demo')).toMatchObject({
    createdCount: created,
    updatedCount: updated,
    skippedCount: skipped,
    error,
  })
}

async function storeTennis(
  catalog: Catalog,
  id: string,
  sourceRef: string,
  status: 'review' | 'published',
) {
  await catalog.write('match', {
    id,
    sportId: 'sport-tennis',
    competitionId: 'comp-sample-cup',
    date: '2026-10-12',
    round: 'Quarter-final',
    status,
    source: 'import',
    sourceRef,
    createdBy: 'editor-demo',
    reviewedBy: 'admin-demo',
    ...(status === 'published' ? { publishedAt: '2026-10-12T18:00:00+00:00' } : {}),
  })
  await catalog.write('tennisMatch', { matchId: id, ...players, score: sets(4, 3) })
}

describe('runImport', () => {
  it('creates drafts, skips an unchanged fixture, and updates a draft score without publishing', async () => {
    const catalog = await seeded()
    try {
      await expectRun(catalog, readImportFixture(), 2, 0, 0)
      expect(await catalog.read('match', 'match-import-cup')).toMatchObject({
        status: 'draft',
        source: 'import',
        sourceRef: 'sample-cup-sf',
        createdBy: 'admin-demo',
      })
      expect(await catalog.read('match', 'match-import-league')).toMatchObject({
        status: 'draft',
        source: 'import',
        sourceRef: 'sample-league-md12',
      })
      const listed = JSON.stringify(
        await listPublishedMatches(catalogDb(catalog), { limit: 20, offset: 0 }),
      )
      expect(listed).not.toContain('match-import-cup')
      expect(listed).not.toContain('match-import-league')
      await expectRun(catalog, readImportFixture(), 0, 0, 2)
      expect(await catalog.read('match', 'match-import-cup')).toMatchObject({
        id: 'match-import-cup',
      })
      const changed = shipped()
      rowAt(changed, 0).score = sets(2, 1)
      await expectRun(catalog, changed, 0, 1, 1)
      expect(await catalog.read('tennisMatch', 'match-import-cup')).toMatchObject({
        score: sets(2, 1),
      })
      expect(await catalog.read('match', 'match-import-cup')).toMatchObject({ status: 'draft' })
      expect(
        JSON.stringify(await listPublishedMatches(catalogDb(catalog), { limit: 20, offset: 0 })),
      ).not.toContain('match-import-cup')
    } finally {
      await catalog.close()
    }
  })

  it('skips review and published source refs, and stores the valid row when one row fails', async () => {
    const catalog = await seeded()
    try {
      for (const status of ['published', 'review'] as const) {
        const sourceRef = status === 'published' ? 'sample-published' : 'sample-review'
        await storeTennis(catalog, `match-import-${status}`, sourceRef, status)
      }
      await expectRun(
        catalog,
        {
          matches: [
            tennis('match-import-published-new', 'sample-published', sets(1, 0)),
            tennis('match-import-review-new', 'sample-review', sets(0, 1)),
          ],
        },
        0,
        0,
        2,
      )
      for (const status of ['published', 'review'] as const) {
        const id = `match-import-${status}`
        expect(await catalog.read('match', id)).toMatchObject({ status })
        expect(await catalog.read('tennisMatch', id)).toMatchObject({ score: sets(4, 3) })
        expect(await catalog.read('match', `${id}-new`)).toBeUndefined()
      }
      const broken = shipped()
      rowAt(broken, 0).score = [
        [7, 6],
        [6, 4],
      ]
      await expectRun(catalog, broken, 1, 0, 0, tiebreak)
      expect(await catalog.read('match', 'match-import-cup')).toBeUndefined()
      expect(await catalog.read('match', 'match-import-league')).toMatchObject({
        status: 'draft',
        source: 'import',
      })
    } finally {
      await catalog.close()
    }
  })
})
