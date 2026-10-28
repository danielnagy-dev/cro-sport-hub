import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { EditorAuthGuard, JWT_SECRET } from './auth/role.guard.js'
import { CREDENTIAL_STORE, LoginController } from './auth/login.controller.js'
import { openCatalog } from './catalog/catalog.js'
import { seedCatalog } from './catalog/seed.js'
import * as schema from './catalog/schema.js'
import { EditorLookupsController } from './editor-lookups.controller.js'
import { MatchDraftsController } from './match-drafts.controller.js'
import { CATALOG_OPENER, MatchesController, type CatalogOpener } from './matches.controller.js'
import { setupOpenApi } from './openapi.js'

const secret = 'test-jwt-secret-that-is-at-least-32'

describe('editor lookup routes', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    await close?.()
    close = undefined
  })

  async function bearer(role: string, sub = 'editor-demo'): Promise<string> {
    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(secret))
    return `Bearer ${token}`
  }

  async function start(): Promise<number> {
    const client = new PGlite()
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    const seeded = await open()
    await seedCatalog(seeded)
    await seeded.close()
    const moduleRef = await Test.createTestingModule({
      controllers: [
        EditorLookupsController,
        MatchesController,
        MatchDraftsController,
        LoginController,
      ],
      providers: [
        { provide: CATALOG_OPENER, useValue: open },
        { provide: CREDENTIAL_STORE, useValue: () => Promise.reject(new Error('unused')) },
        { provide: JWT_SECRET, useValue: secret },
        EditorAuthGuard,
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

  async function send(port: number, path: string, token?: string) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: token === undefined ? {} : { authorization: token },
    })
    const text = await response.text()
    return { status: response.status, body: text === '' ? undefined : JSON.parse(text) }
  }

  it('lists ids and names for an editor and keeps the lists off the public API', async () => {
    const port = await start()
    const editor = await bearer('editor')
    const admin = await bearer('admin', 'admin-demo')

    expect(await send(port, '/api/editor/competitions?sport=tennis')).toMatchObject({
      status: 401,
      body: { message: 'Invalid token' },
    })
    expect(await send(port, '/api/editor/teams')).toMatchObject({
      status: 401,
      body: { message: 'Invalid token' },
    })
    expect(
      await send(port, '/api/editor/athletes?sport=tennis', await bearer('viewer')),
    ).toMatchObject({ status: 403, body: { message: 'Forbidden' } })

    expect(await send(port, '/api/editor/competitions?sport=tennis', editor)).toEqual({
      status: 200,
      body: [{ id: 'comp-sample-cup', name: 'Sample Cup', season: '2026' }],
    })
    expect(await send(port, '/api/editor/athletes?sport=tennis', editor)).toEqual({
      status: 200,
      body: [
        { id: 'sample-player-a', name: 'Sample Player A' },
        { id: 'sample-player-b', name: 'Sample Player B' },
        { id: 'sample-player-c', name: 'Sample Player C' },
        { id: 'sample-player-d', name: 'Sample Player D' },
      ],
    })
    expect(await send(port, '/api/editor/competitions?sport=football', editor)).toEqual({
      status: 200,
      body: [{ id: 'comp-sample-league', name: 'Sample League', season: '2026/27' }],
    })
    expect(await send(port, '/api/editor/athletes?sport=football', admin)).toEqual({
      status: 200,
      body: [
        { id: 'bruno-peric', name: 'Bruno Perić' },
        { id: 'filip-saric', name: 'Filip Šarić' },
        { id: 'karlo-brkic', name: 'Karlo Brkić' },
        { id: 'leon-vukovic', name: 'Leon Vuković' },
        { id: 'mateo-jurcic', name: 'Mateo Jurčić' },
      ],
    })
    expect(await send(port, '/api/editor/teams', admin)).toEqual({
      status: 200,
      body: [
        { id: 'club-sample-away', name: 'Sample Away' },
        { id: 'club-sample-home', name: 'Sample Home' },
        { id: 'club-sample-town', name: 'Sample Town' },
      ],
    })

    expect(await send(port, '/api/editor/competitions', editor)).toMatchObject({
      status: 400,
      body: { message: 'Unknown sport' },
    })
    expect(await send(port, '/api/editor/athletes?sport=curling', editor)).toMatchObject({
      status: 400,
      body: { message: 'Unknown sport' },
    })
    expect((await send(port, '/api/teams')).status).toBe(404)

    const docs = await send(port, '/docs-json')
    const paths = docs.body.paths
    expect(paths['/api/editor/competitions'].get.security).toEqual([{ bearer: [] }])
    expect(paths['/api/editor/athletes'].get.security).toEqual([{ bearer: [] }])
    expect(paths['/api/editor/teams'].get.security).toEqual([{ bearer: [] }])
    expect(paths['/api/teams']).toBeUndefined()
  }, 20_000)
})
