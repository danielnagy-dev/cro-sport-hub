import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { AdminAuthGuard, JWT_SECRET } from './auth/role.guard.js'
import { openCatalog } from './catalog/catalog.js'
import { seedCatalog } from './catalog/seed.js'
import * as schema from './catalog/schema.js'
import { ImportController } from './import.controller.js'
import { CATALOG_OPENER, type CatalogOpener } from './catalog/catalog.module.js'
import { MatchesController } from './matches.controller.js'
import { setupOpenApi } from './openapi.js'

const secret = 'test-jwt-secret-that-is-at-least-32'

describe('import routes', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    await close?.()
    close = undefined
  })

  async function bearer(role: string, sub: string): Promise<string> {
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
      controllers: [ImportController, MatchesController],
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
    return address.port
  }

  async function send(port: number, method: string, path: string, token?: string) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: token === undefined ? {} : { authorization: token },
    })
    const text = await response.text()
    return { status: response.status, body: text === '' ? undefined : JSON.parse(text) }
  }

  it('rejects an editor, lists the admin run, and leaves drafts off the public list', async () => {
    const port = await start()
    const editor = await bearer('editor', 'editor-demo')
    const admin = await bearer('admin', 'admin-demo')
    expect(await send(port, 'POST', '/api/admin/import')).toMatchObject({
      status: 401,
      body: { message: 'Invalid token' },
    })
    expect(await send(port, 'GET', '/api/admin/import/runs')).toMatchObject({
      status: 401,
      body: { message: 'Invalid token' },
    })
    expect(await send(port, 'POST', '/api/admin/import', editor)).toMatchObject({
      status: 403,
      body: { message: 'Forbidden' },
    })
    expect(await send(port, 'GET', '/api/admin/import/runs', editor)).toMatchObject({
      status: 403,
      body: { message: 'Forbidden' },
    })

    const first = await send(port, 'POST', '/api/admin/import', admin)
    expect(first).toMatchObject({
      status: 201,
      body: { createdCount: 2, updatedCount: 0, skippedCount: 0, error: '' },
    })
    const second = await send(port, 'POST', '/api/admin/import', admin)
    expect(second).toMatchObject({
      status: 201,
      body: { createdCount: 0, updatedCount: 0, skippedCount: 2, error: '' },
    })
    const runs = await send(port, 'GET', '/api/admin/import/runs', admin)
    expect(runs.status).toBe(200)
    expect(runs.body[0].id).toBe(second.body.id)
    expect(runs.body[1].id).toBe(first.body.id)

    const page = await send(port, 'GET', '/api/matches')
    expect(page.status).toBe(200)
    const listed = JSON.stringify(page.body)
    expect(listed).not.toContain('match-import-cup')
    expect(listed).not.toContain('match-import-league')

    const docs = await send(port, 'GET', '/docs-json')
    const paths = docs.body.paths
    expect(paths['/api/admin/import'].post.security).toEqual([{ bearer: [] }])
    expect(paths['/api/admin/import/runs'].get.security).toEqual([{ bearer: [] }])
  }, 20_000)
})
