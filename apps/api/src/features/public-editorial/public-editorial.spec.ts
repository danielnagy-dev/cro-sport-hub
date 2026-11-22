import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { openCatalog } from '../../catalog/catalog.js'
import { type CatalogDb } from '../../catalog/errors.js'
import { seedCatalog } from '../../catalog/seed.js'
import * as schema from '../../catalog/schema.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import { PublicEditorialController } from './public-editorial.controller.js'
import {
  listPublicAthleteIndex,
  listPublicDayAppearances,
  publicAppearanceSchema,
  readNationalTeamSchedule,
  readPublicAthleteProfile,
  unknownAthleteMessage,
  unknownNationalTeamMessage,
  unknownSportMessage,
} from './public-editorial.js'

async function withDb(): Promise<{ rows: CatalogDb; close: () => Promise<void> }> {
  const client = new PGlite()
  const rows = drizzle(client, { schema })
  const catalog = await openCatalog(rows)
  await seedCatalog(catalog)
  return {
    rows,
    close: async () => {
      await catalog.close()
      await client.close()
    },
  }
}

function assertNoLeak(value: unknown): void {
  expect(JSON.stringify(value)).not.toMatch(/creatorKind|publishSlot|networkPost|draft/i)
}

describe('public-editorial', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    await close?.()
    close = undefined
  })

  it('helpers: day list, profile, schedule, 404 seams, schema omit', async () => {
    const opened = await withDb()
    close = opened.close
    const day = await listPublicDayAppearances(opened.rows, { day: '2026-11-12' })
    expect(day).toHaveLength(1)
    expect(day[0]?.nationalTeam?.slug).toBe('croatia-football')
    expect(day[0]?.athlete).toBeUndefined()
    assertNoLeak(day)
    expect(await listPublicDayAppearances(opened.rows, { day: '2099-01-01' })).toEqual([])
    const index = await listPublicAthleteIndex(opened.rows, 'football')
    expect(index.some((row) => row.slug === 'karlo-brkic')).toBe(true)
    const profile = await readPublicAthleteProfile(opened.rows, 'karlo-brkic')
    expect(profile.history.map((row) => row.id)).toEqual(
      expect.arrayContaining(['appearance-sample-football', 'appearance-sample-football-nt']),
    )
    assertNoLeak(profile)
    const schedule = await readNationalTeamSchedule(opened.rows, 'croatia-football', 'football')
    expect(schedule.past).toHaveLength(1)
    expect(schedule.current).toEqual([])
    expect(schedule.upcoming).toEqual([])
    assertNoLeak(schedule)
    await expect(readPublicAthleteProfile(opened.rows, 'no-such')).rejects.toMatchObject({
      message: unknownAthleteMessage,
    })
    await expect(readNationalTeamSchedule(opened.rows, 'no-such')).rejects.toMatchObject({
      message: unknownNationalTeamMessage,
    })
    await expect(listPublicAthleteIndex(opened.rows, 'rugby')).rejects.toMatchObject({
      message: unknownSportMessage,
    })
    const base = {
      id: 'app-1',
      sportSlug: 'tennis',
      competitionId: 'comp-1',
      athlete: { id: 'a-1', slug: 'sample-player-a', name: 'Sample Player A' },
      opponentLabel: 'Rival',
      startsAt: '2026-11-08T14:00:00+00:00',
      status: 'completed',
    }
    expect(publicAppearanceSchema.safeParse(base).success).toBe(true)
    expect(publicAppearanceSchema.safeParse({ ...base, creatorKind: 'manual' }).success).toBe(false)
    expect(publicAppearanceSchema.safeParse({ ...base, publishSlotId: 's' }).success).toBe(false)
  })

  it('routes: public GETs, empty day, 404/400', async () => {
    const client = new PGlite()
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    const seeded = await open()
    await seedCatalog(seeded)
    await seeded.close()
    const moduleRef = await Test.createTestingModule({
      controllers: [PublicEditorialController],
      providers: [{ provide: CATALOG_OPENER, useValue: open }],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.listen(0, '127.0.0.1')
    close = async () => {
      await app.close()
      await client.close()
    }
    const port = (app.getHttpServer().address() as AddressInfo).port
    const get = async (path: string) => {
      const response = await fetch(`http://127.0.0.1:${port}${path}`)
      return { status: response.status, body: await response.text() }
    }
    const day = await get('/api/public/appearances?day=2026-11-12')
    expect(day.status).toBe(200)
    expect(day.body).not.toMatch(/creatorKind|publishSlot|networkPost/i)
    expect(JSON.parse(day.body)).toHaveLength(1)
    expect((await get('/api/public/athletes?sport=football')).status).toBe(200)
    expect((await get('/api/public/athletes/karlo-brkic')).status).toBe(200)
    expect((await get('/api/public/national-teams/croatia-football/schedule')).status).toBe(200)
    expect((await get('/api/public/athletes/missing')).status).toBe(404)
    expect((await get('/api/public/national-teams/missing/schedule')).status).toBe(404)
    expect((await get('/api/public/appearances?day=not-a-day')).status).toBe(400)
  })
})
