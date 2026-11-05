import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { describe, expect, it } from 'vite-plus/test'
import { openCatalog } from '../../catalog/catalog.js'
import { seedCatalog } from '../../catalog/seed.js'
import * as schema from '../../catalog/schema.js'
import { listFootballResultsForAthlete } from './list-football-results.js'

describe('listFootballResultsForAthlete', () => {
  it('lists published appearances with the club name, and omits draft matches', async () => {
    const client = new PGlite()
    const db = drizzle(client, { schema })
    const catalog = await openCatalog(db)
    await seedCatalog(catalog)

    const karlo = await listFootballResultsForAthlete(db, 'karlo-brkic')
    expect(karlo).toHaveLength(1)
    expect(karlo[0]).toEqual({
      id: 'match-sample-league',
      competition: 'Sample League',
      date: '2026-10-19',
      round: 'Matchday 8',
      club: 'Sample Home',
      started: true,
      minutes: 90,
      goals: 2,
      assists: 0,
      yellowCards: 0,
      redCard: false,
    })
    expect(JSON.stringify(karlo)).not.toContain('club-sample')

    const filip = await listFootballResultsForAthlete(db, 'filip-saric')
    expect(filip[0]?.yellowCards).toBe(2)
    expect(filip[0]?.redCard).toBe(true)

    const bruno = await listFootballResultsForAthlete(db, 'bruno-peric')
    expect(bruno[0]?.minutes).toBe(0)
    expect(bruno[0]?.started).toBe(false)
    expect(bruno[0]?.yellowCards).toBe(1)

    await catalog.write('match', {
      id: 'match-draft-league',
      sportId: 'sport-football',
      competitionId: 'comp-sample-league',
      date: '2026-10-01',
      round: 'Matchday 1',
      status: 'draft',
      source: 'manual',
      createdBy: 'editor-demo',
    })
    await catalog.write('footballMatch', {
      matchId: 'match-draft-league',
      homeTeamId: 'club-sample-home',
      awayTeamId: 'club-sample-away',
      homeGoals: 0,
      awayGoals: 0,
    })
    await catalog.write('appearance', {
      matchId: 'match-draft-league',
      athleteId: 'karlo-brkic',
      teamId: 'club-sample-home',
      started: true,
      minutes: 90,
      goals: 1,
      assists: 0,
      yellowCards: 0,
      redCard: false,
    })
    await catalog.close()

    const afterDraft = await listFootballResultsForAthlete(db, 'karlo-brkic')
    expect(afterDraft.find((row) => row.id === 'match-draft-league')).toBeUndefined()

    await client.close()
  })
})
