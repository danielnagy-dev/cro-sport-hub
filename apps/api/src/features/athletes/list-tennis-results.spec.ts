import { tennisPercentages } from '@cro-sport-hub/shared-types'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { describe, expect, it } from 'vite-plus/test'
import { openCatalog } from '../../catalog/catalog.js'
import { seedCatalog } from '../../catalog/seed.js'
import * as schema from '../../catalog/schema.js'
import { listTennisResultsForAthlete } from './list-tennis-results.js'

describe('listTennisResultsForAthlete', () => {
  it('maps percentages through tennisPercentages, with null when a denominator is 0', async () => {
    const client = new PGlite()
    const db = drizzle(client, { schema })
    const catalog = await openCatalog(db)
    await seedCatalog(catalog)

    const final = await listTennisResultsForAthlete(db, 'sample-player-a')
    expect(final).toHaveLength(1)
    const row = final[0]
    expect(row?.competition).toBe('Sample Cup')
    expect(row?.date).toBe('2026-10-18')
    expect(row?.round).toBe('Final')
    expect(row?.opponent).toBe('Sample Player B')
    expect(row?.winner).toBe('athlete')
    expect(row?.score).toEqual([
      [6, 4],
      [7, 6, 5],
    ])
    expect(row?.percentages).not.toBeNull()
    expect(row?.percentages?.firstServePct).toBe(60)
    expect(row?.percentages?.firstServePointsWonPct).toBe(
      tennisPercentages({
        aces: 3,
        doubleFaults: 1,
        firstServeIn: 6,
        firstServeTotal: 10,
        firstServePointsWon: 4,
        secondServePointsWon: 2,
        secondServeTotal: 4,
        breakPointsSaved: 1,
        breakPointsFaced: 2,
        breakPointsWon: 2,
        breakPointsTotal: 4,
        totalPointsWon: 20,
      }).firstServePointsWonPct,
    )

    await catalog.write('match', {
      id: 'match-stats-null-pct',
      sportId: 'sport-tennis',
      competitionId: 'comp-sample-cup',
      date: '2026-10-10',
      round: 'R1',
      status: 'published',
      source: 'manual',
      createdBy: 'editor-demo',
      reviewedBy: 'admin-demo',
      publishedAt: '2026-10-10T12:00:00+00:00',
    })
    await catalog.write('tennisMatch', {
      matchId: 'match-stats-null-pct',
      playerAId: 'sample-player-a',
      playerBId: 'sample-player-b',
      winnerId: 'sample-player-a',
      bestOf: 3,
      score: [
        [6, 4],
        [6, 3],
      ],
      retired: false,
    })
    await catalog.write('tennisMatchStats', {
      matchId: 'match-stats-null-pct',
      athleteId: 'sample-player-a',
      aces: 0,
      doubleFaults: 0,
      firstServeIn: 0,
      firstServeTotal: 4,
      firstServePointsWon: 0,
      secondServePointsWon: 0,
      secondServeTotal: 4,
      breakPointsSaved: 0,
      breakPointsFaced: 0,
      breakPointsWon: 0,
      breakPointsTotal: 0,
      totalPointsWon: 4,
    })
    await catalog.close()

    const listed = await listTennisResultsForAthlete(db, 'sample-player-a')
    const withNullPct = listed.find((item) => item.id === 'match-stats-null-pct')
    expect(withNullPct?.percentages?.firstServePointsWonPct).toBeNull()
    expect(withNullPct?.percentages?.firstServePointsWonPct).not.toBe(0)
    expect(withNullPct?.percentages?.breakPointsSavedPct).toBeNull()

    await client.close()
  })
})
