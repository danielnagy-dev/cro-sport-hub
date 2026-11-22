import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { CatalogError, openCatalog } from '../../catalog/catalog.js'
import { type CatalogDb } from '../../catalog/errors.js'
import { seedCatalog } from '../../catalog/seed.js'
import * as schema from '../../catalog/schema.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import { EditorAuthGuard, JWT_SECRET } from '../../auth/role.guard.js'
import { AppearancesController } from './appearances.controller.js'
import {
  appearanceListQuerySchema,
  createAppearance,
  createLineupEntry,
  listAppearances,
  lineupEntryWriteSchema,
  updateAppearance,
  updateLineupEntry,
} from './appearances.js'
const SECRET = 'test-jwt-secret-that-is-at-least-32'
const TEAM_ID = 'nt-croatia-football'
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
function athleteBody(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-tennis-a',
    sportId: 'sport-tennis',
    sportSlug: 'tennis',
    competitionId: 'comp-sample-cup',
    athleteId: 'sample-player-a',
    athleteSport: 'tennis',
    opponentLabel: 'Sample Rival',
    startsAt: '2026-11-22T15:00:00.000Z',
    status: 'scheduled',
    creatorKind: 'manual',
    ...overrides,
  }
}

function teamBody(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-team-home',
    sportId: 'sport-football',
    sportSlug: 'football',
    competitionId: 'comp-sample-league',
    nationalTeamId: TEAM_ID,
    opponentLabel: 'Sample Away XI',
    startsAt: '2026-11-22T18:00:00.000Z',
    status: 'scheduled',
    creatorKind: 'manual',
    ...overrides,
  }
}

describe('appearances', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    await close?.()
    close = undefined
  })

  it('helpers: filters, XOR, national-team row', async () => {
    const opened = await withDb()
    close = opened.close
    const rows = opened.rows
    expect((await createAppearance(rows, athleteBody())).athleteId).toBe('sample-player-a')
    expect((await createAppearance(rows, teamBody())).nationalTeamId).toBe(TEAM_ID)
    await createAppearance(
      rows,
      teamBody({ id: 'app-team-next', startsAt: '2026-11-24T18:00:00.000Z' }),
    )
    await rows.insert(schema.lineupEntries).values({
      appearanceId: 'app-team-home',
      athleteId: 'karlo-brkic',
      athleteSport: 'football',
      started: true,
      minutes: 90,
      stats: {},
    })
    expect((await listAppearances(rows, { day: '2026-11-22' })).map((r) => r.id).sort()).toEqual([
      'app-team-home',
      'app-tennis-a',
    ])
    expect(
      (await listAppearances(rows, { athleteId: 'karlo-brkic', day: '2026-11-22' })).map(
        (r) => r.id,
      ),
    ).toEqual(['app-team-home'])
    expect(
      (await listAppearances(rows, { athleteSlug: 'karlo-brkic', day: '2026-11-22' })).map(
        (r) => r.id,
      ),
    ).toEqual(['app-team-home'])
    expect(
      (await listAppearances(rows, { from: '2026-11-22', to: '2026-11-22' }))
        .map((r) => r.id)
        .sort(),
    ).toEqual(['app-team-home', 'app-tennis-a'])
    expect((await listAppearances(rows, { from: '2026-11-23' })).map((r) => r.id)).toEqual([
      'app-team-next',
    ])
    expect((await listAppearances(rows, { to: '2026-11-07' })).map((r) => r.id)).toEqual([])
    await expect(listAppearances(rows, { athleteSlug: 'missing-athlete' })).rejects.toMatchObject({
      code: 'unknown-ref',
    })
    expect(
      appearanceListQuerySchema.safeParse({ from: '2026-11-24', to: '2026-11-22' }).success,
    ).toBe(false)
    expect(appearanceListQuerySchema.safeParse({ athleteSlug: 'Bad' }).success).toBe(false)
    expect(
      appearanceListQuerySchema.safeParse({
        athleteId: 'karlo-brkic',
        athleteSlug: 'karlo-brkic',
      }).success,
    ).toBe(false)
    expect(
      (await updateAppearance(rows, 'app-team-home', { ...teamBody(), status: 'completed' }))
        .status,
    ).toBe('completed')
    await expect(createAppearance(rows, { id: 'bad' })).rejects.toBeInstanceOf(CatalogError)
    await expect(
      createAppearance(rows, { ...athleteBody({ id: 'both' }), nationalTeamId: TEAM_ID }),
    ).rejects.toMatchObject({ code: 'invalid' })
  })

  it('helpers: lineup create/update persists stats', async () => {
    const opened = await withDb()
    close = opened.close
    const rows = opened.rows
    await createAppearance(rows, teamBody())
    const created = await createLineupEntry(rows, {
      appearanceId: 'app-team-home',
      athleteId: 'karlo-brkic',
      athleteSport: 'football',
      started: true,
      minutes: 45,
      stats: { goals: 1 },
    })
    expect(created).toEqual({
      appearanceId: 'app-team-home',
      athleteId: 'karlo-brkic',
      athleteSport: 'football',
      started: true,
      minutes: 45,
      stats: { goals: 1 },
    })
    expect(
      (
        await updateLineupEntry(rows, 'app-team-home', 'karlo-brkic', {
          appearanceId: 'app-team-home',
          athleteId: 'karlo-brkic',
          athleteSport: 'football',
          started: false,
          minutes: 20,
          stats: { goals: 2, assists: 1 },
        })
      ).stats,
    ).toEqual({ goals: 2, assists: 1 })
    expect(
      (await listAppearances(rows, { athleteSlug: 'karlo-brkic', day: '2026-11-22' })).map(
        (r) => r.id,
      ),
    ).toEqual(['app-team-home'])
    await expect(
      createLineupEntry(rows, {
        appearanceId: 'missing-app',
        athleteId: 'karlo-brkic',
        athleteSport: 'football',
        started: true,
        stats: {},
      }),
    ).rejects.toMatchObject({ code: 'unknown-ref' })
    await expect(
      createLineupEntry(rows, {
        appearanceId: 'app-team-home',
        athleteId: 'missing-athlete',
        athleteSport: 'football',
        started: true,
        stats: {},
      }),
    ).rejects.toMatchObject({ code: 'unknown-ref' })
    expect(lineupEntryWriteSchema.safeParse({ appearanceId: 'a', athleteId: 'b' }).success).toBe(
      false,
    )
  })

  it('routes: unauthorized write rejected', async () => {
    const client = new PGlite()
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    const seeded = await open()
    await seedCatalog(seeded)
    await seeded.close()
    const moduleRef = await Test.createTestingModule({
      controllers: [AppearancesController],
      providers: [
        { provide: CATALOG_OPENER, useValue: open },
        { provide: JWT_SECRET, useValue: SECRET },
        EditorAuthGuard,
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.listen(0, '127.0.0.1')
    close = async () => {
      await app.close()
      await client.close()
    }
    const port = (app.getHttpServer().address() as AddressInfo).port
    const send = async (method: string, path: string, body?: unknown, token?: string) => {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          ...(token === undefined ? {} : { authorization: token }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      return { status: response.status, body: await response.text() }
    }
    const editor = `Bearer ${await new SignJWT({ role: 'editor' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('editor-demo')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(SECRET))}`
    const body = athleteBody({ id: 'app-route-a' })
    expect((await send('POST', '/api/editor/appearances', body)).status).toBe(401)
    expect((await send('POST', '/api/editor/appearances', body, editor)).status).toBe(201)
    const team = teamBody({ id: 'app-route-team' })
    expect((await send('POST', '/api/editor/appearances', team, editor)).status).toBe(201)
    const lineup = {
      athleteId: 'karlo-brkic',
      athleteSport: 'football',
      started: true,
      minutes: 90,
      stats: { goals: 0 },
    }
    expect(
      (await send('POST', '/api/editor/appearances/app-route-team/lineup', lineup)).status,
    ).toBe(401)
    expect(
      (await send('POST', '/api/editor/appearances/app-route-team/lineup', lineup, editor)).status,
    ).toBe(201)
    expect(
      (
        await send(
          'PUT',
          '/api/editor/appearances/app-route-team/lineup/karlo-brkic',
          { ...lineup, started: false, stats: { goals: 1 } },
          editor,
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await send(
          'GET',
          '/api/editor/appearances?athleteSlug=karlo-brkic&from=2026-11-22',
          undefined,
          editor,
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await send(
          'GET',
          '/api/editor/appearances?from=2026-11-24&to=2026-11-22',
          undefined,
          editor,
        )
      ).status,
    ).toBe(400)
  })
})
