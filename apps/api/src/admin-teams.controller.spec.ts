import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { teamSchema } from '@cro-sport-hub/shared-types'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { AdminTeamsController } from './admin-teams.controller.js'
import { AdminAuthGuard, JWT_SECRET } from './auth/role.guard.js'
import { openCatalog } from './catalog/catalog.js'
import { seedCatalog } from './catalog/seed.js'
import * as schema from './catalog/schema.js'
import { CATALOG_OPENER, type CatalogOpener } from './matches.controller.js'
import { setupOpenApi } from './openapi.js'

const secret = 'test-jwt-secret-that-is-at-least-32'

function club(id: string, name: string, shortName: string, sportId = 'sport-football') {
  return { id, sportId, slug: id, name, shortName, country: 'HR' }
}

describe('admin team routes', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    await close?.()
    close = undefined
  })

  async function bearer(role: string, sub = 'admin-demo'): Promise<string> {
    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(secret))
    return `Bearer ${token}`
  }

  async function start(): Promise<{ port: number; open: CatalogOpener }> {
    const client = new PGlite()
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    const seeded = await open()
    await seedCatalog(seeded)
    await seeded.close()
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminTeamsController],
      providers: [
        { provide: CATALOG_OPENER, useValue: open },
        { provide: JWT_SECRET, useValue: secret },
        AdminAuthGuard,
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    setupOpenApi(app)
    await app.listen(0, '127.0.0.1')
    close = async () => {
      await app.close()
      await client.close()
    }
    const address = app.getHttpServer().address() as AddressInfo | null
    if (!address) throw new Error('Expected the test server to be listening')
    return { port: address.port, open }
  }

  async function send(port: number, method: string, path: string, body?: unknown, token?: string) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token === undefined ? {} : { authorization: token }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await response.text()
    return { status: response.status, body: text === '' ? undefined : JSON.parse(text) }
  }

  function expectCall(
    response: { status: number; body: unknown },
    status: number,
    message?: string,
  ) {
    if (message === undefined) expect(response).toEqual({ status, body: undefined })
    else expect(response).toMatchObject({ status, body: { message } })
  }

  it('lists, writes, and deletes clubs for an admin only', async () => {
    const { port, open } = await start()
    const admin = await bearer('admin')
    const editor = await bearer('editor', 'editor-demo')
    const north = club('sample-north', 'Sample North', 'SN')
    const renamed = { ...north, shortName: 'NORTH' }
    const calls: [string, string, unknown?][] = [
      ['GET', '/api/admin/teams'],
      ['POST', '/api/admin/teams', north],
      ['PUT', '/api/admin/teams/sample-north', renamed],
      ['DELETE', '/api/admin/teams/club-sample-home'],
    ]
    for (const [method, path, body] of calls) {
      expectCall(await send(port, method, path, body), 401, 'Invalid token')
      expectCall(await send(port, method, path, body, editor), 403, 'Forbidden')
    }

    const created = await send(port, 'POST', '/api/admin/teams', north, admin)
    expect(created.status).toBe(201)
    expect(teamSchema.parse(created.body)).toEqual(north)
    const listed = await send(port, 'GET', '/api/admin/teams', undefined, admin)
    const clubs = teamSchema.array().parse(listed.body)
    expect(clubs.map((row) => row.name)).toEqual([
      'Sample Away',
      'Sample Home',
      'Sample North',
      'Sample Town',
    ])
    expect(clubs.every((row) => row.sportId === 'sport-football')).toBe(true)

    const updated = await send(port, 'PUT', '/api/admin/teams/sample-north', renamed, admin)
    expect(updated.status).toBe(200)
    expect(teamSchema.parse(updated.body)).toEqual(renamed)

    const tennis = club('tennis-fc', 'Tennis FC', 'TF', 'sport-tennis')
    expectCall(
      await send(port, 'POST', '/api/admin/teams', tennis, admin),
      400,
      'Teams are football clubs',
    )
    expectCall(
      await send(
        port,
        'PUT',
        '/api/admin/teams/sample-north',
        { ...renamed, sportId: 'sport-tennis' },
        admin,
      ),
      400,
      'Teams are football clubs',
    )
    const afterTennis = teamSchema
      .array()
      .parse((await send(port, 'GET', '/api/admin/teams', undefined, admin)).body)
    expect(afterTennis.map((row) => row.id)).not.toContain('tennis-fc')
    expect(afterTennis).toContainEqual(renamed)

    expectCall(
      await send(port, 'POST', '/api/admin/teams', north, admin),
      409,
      'That record is already stored',
    )
    expectCall(
      await send(
        port,
        'PUT',
        '/api/admin/teams/missing-club',
        club('missing-club', 'Missing', 'MI'),
        admin,
      ),
      404,
      'Unknown team',
    )
    expectCall(
      await send(port, 'DELETE', '/api/admin/teams/missing-club', undefined, admin),
      404,
      'Unknown team',
    )
    expectCall(
      await send(port, 'DELETE', '/api/admin/teams/club-sample-home', undefined, admin),
      409,
      'Team is in use',
    )
    expectCall(
      await send(port, 'DELETE', '/api/admin/teams/club-sample-town', undefined, admin),
      409,
      'Team is in use',
    )

    expect(
      (await send(port, 'POST', '/api/admin/teams', club('side-only', 'Side Only', 'SO'), admin))
        .status,
    ).toBe(201)
    const catalog = await open()
    await catalog.write('match', {
      id: 'match-side-only',
      sportId: 'sport-football',
      competitionId: 'comp-sample-league',
      date: '2026-10-21',
      round: 'Matchday 9',
      status: 'draft',
      source: 'manual',
      createdBy: 'admin-demo',
    })
    await catalog.write('footballMatch', {
      matchId: 'match-side-only',
      homeTeamId: 'side-only',
      awayTeamId: 'club-sample-away',
      homeGoals: 1,
      awayGoals: 0,
    })
    await catalog.close()
    expectCall(
      await send(port, 'DELETE', '/api/admin/teams/side-only', undefined, admin),
      409,
      'Team is in use',
    )
    expectCall(await send(port, 'DELETE', '/api/admin/teams/sample-north', undefined, admin), 204)

    const remaining = teamSchema
      .array()
      .parse((await send(port, 'GET', '/api/admin/teams', undefined, admin)).body)
    expect(remaining.map((row) => row.id)).toEqual([
      'club-sample-away',
      'club-sample-home',
      'club-sample-town',
      'side-only',
    ])

    const paths = (await send(port, 'GET', '/docs-json')).body.paths
    expect(paths['/api/teams']).toBeUndefined()
    for (const [path, method] of [
      ['/api/admin/teams', 'get'],
      ['/api/admin/teams', 'post'],
      ['/api/admin/teams/{id}', 'put'],
      ['/api/admin/teams/{id}', 'delete'],
    ] as const) {
      expect(paths[path][method].security).toEqual([{ bearer: [] }])
    }
    expect((await send(port, 'GET', '/api/teams')).status).toBe(404)
  }, 20_000)
})
