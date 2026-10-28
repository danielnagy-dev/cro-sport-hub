import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { competitionSchema } from '@cro-sport-hub/shared-types'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import {
  AdminCompetitionsController,
  COMPETITION_OPENER,
  type CompetitionOpener,
} from './admin-competitions.controller.js'
import { JWT_SECRET, AdminAuthGuard } from './auth/role.guard.js'
import { openCatalog } from './catalog/catalog.js'
import { seedCatalog } from './catalog/seed.js'
import * as schema from './catalog/schema.js'
import { competitionSession } from './competition-admin.js'
import { setupOpenApi } from './openapi.js'

const secret = 'test-jwt-secret-that-is-at-least-32'
const harbor = {
  id: 'comp-harbor-open',
  sportId: 'sport-tennis',
  name: 'Harbor Open',
  season: '2026',
  level: 'international' as const,
}

describe('admin competition routes', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    await close?.()
    close = undefined
  })

  async function bearer(role: string): Promise<string> {
    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(role === 'admin' ? 'admin-demo' : 'editor-demo')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(secret))
    return `Bearer ${token}`
  }

  async function start(): Promise<number> {
    const client = new PGlite()
    const db = drizzle(client, { schema })
    const open: CompetitionOpener = () => competitionSession(db)
    const seeded = await openCatalog(db)
    await seedCatalog(seeded)
    await seeded.close()
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminCompetitionsController],
      providers: [
        { provide: COMPETITION_OPENER, useValue: open },
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
    return address.port
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

  it('lets an admin manage competitions and refuses an editor', async () => {
    const port = await start()
    const admin = await bearer('admin')
    const editor = await bearer('editor')
    const routes = [
      ['GET', '/api/admin/competitions'],
      ['POST', '/api/admin/competitions'],
      ['PUT', '/api/admin/competitions/comp-sample-cup'],
      ['DELETE', '/api/admin/competitions/comp-sample-cup'],
    ] as const
    for (const [method, path] of routes) {
      expect(await send(port, method, path)).toMatchObject({
        status: 401,
        body: { message: 'Invalid token' },
      })
      expect(await send(port, method, path, undefined, editor)).toMatchObject({
        status: 403,
        body: { message: 'Forbidden' },
      })
    }

    const created = await send(port, 'POST', '/api/admin/competitions', harbor, admin)
    expect(created.status).toBe(201)
    expect(competitionSchema.parse(created.body)).toEqual(harbor)

    const listed = await send(port, 'GET', '/api/admin/competitions', undefined, admin)
    expect(listed.status).toBe(200)
    expect(competitionSchema.parse(listed.body[0])).toEqual(harbor)
    expect(listed.body.map((row: { name: string }) => row.name)).toEqual([
      'Harbor Open',
      'Sample Cup',
      'Sample League',
    ])

    const renamed = { ...harbor, name: 'Zephyr Cup' }
    const updated = await send(port, 'PUT', `/api/admin/competitions/${harbor.id}`, renamed, admin)
    expect(updated.status).toBe(200)
    expect(competitionSchema.parse(updated.body)).toEqual(renamed)

    expect(
      await send(port, 'DELETE', '/api/admin/competitions/comp-sample-cup', undefined, admin),
    ).toMatchObject({ status: 409, body: { message: 'Competition is in use' } })
    const kept = await send(port, 'GET', '/api/admin/competitions', undefined, admin)
    expect(kept.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'comp-sample-cup', name: 'Sample Cup' }),
      ]),
    )

    expect(await send(port, 'POST', '/api/admin/competitions', harbor, admin)).toMatchObject({
      status: 409,
      body: { message: 'That record is already stored' },
    })
    expect(
      await send(
        port,
        'POST',
        '/api/admin/competitions',
        { ...harbor, id: 'comp-ghost', sportId: 'sport-curling' },
        admin,
      ),
    ).toMatchObject({ status: 400, body: { message: 'Unknown row' } })
    const missing = { ...renamed, id: 'comp-missing' }
    expect(
      await send(port, 'PUT', '/api/admin/competitions/comp-missing', missing, admin),
    ).toMatchObject({ status: 404, body: { message: 'Unknown competition' } })
    expect(
      await send(port, 'DELETE', '/api/admin/competitions/comp-missing', undefined, admin),
    ).toMatchObject({ status: 404, body: { message: 'Unknown competition' } })

    expect(
      await send(port, 'DELETE', `/api/admin/competitions/${harbor.id}`, undefined, admin),
    ).toMatchObject({ status: 204, body: undefined })
    const after = await send(port, 'GET', '/api/admin/competitions', undefined, admin)
    expect(after.body.map((row: { id: string }) => row.id)).not.toContain(harbor.id)
    expect(after.body.map((row: { id: string }) => row.id)).toContain('comp-sample-cup')
  }, 30_000)

  it('documents bearer security and no public competitions path', async () => {
    const port = await start()
    const docs = await send(port, 'GET', '/docs-json')
    const paths = docs.body.paths
    expect(paths['/api/competitions']).toBeUndefined()
    expect(paths['/api/admin/competitions'].get.security).toEqual([{ bearer: [] }])
    expect(paths['/api/admin/competitions'].post.security).toEqual([{ bearer: [] }])
    expect(paths['/api/admin/competitions/{id}'].put.security).toEqual([{ bearer: [] }])
    expect(paths['/api/admin/competitions/{id}'].delete.security).toEqual([{ bearer: [] }])
  }, 30_000)
})
