import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { EditorAuthGuard, JWT_SECRET } from '../../auth/role.guard.js'
import { openCatalog } from '../../catalog/catalog.js'
import { seedCatalog } from '../../catalog/seed.js'
import * as schema from '../../catalog/schema.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import { GalleryController } from './gallery.controller.js'
import {
  matchListedTwiceMessage,
  onlyPublishedFootballMessage,
  pickPublishedFootballMessage,
} from './gallery.js'

const secret = 'test-jwt-secret-that-is-at-least-32'

describe('gallery routes', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    await close?.()
  })

  it('creates a draft, validates match ids, edits captions, and requires auth', async () => {
    const client = new PGlite()
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    await seedCatalog(await open())
    const moduleRef = await Test.createTestingModule({
      controllers: [GalleryController],
      providers: [
        { provide: CATALOG_OPENER, useValue: open },
        { provide: JWT_SECRET, useValue: secret },
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
    const auth = `Bearer ${await new SignJWT({ role: 'editor' }).setProtectedHeader({ alg: 'HS256' }).setSubject('editor-demo').setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(secret))}`
    const post = async (body: unknown, bearer?: string) => {
      const response = await fetch(`http://127.0.0.1:${port}/api/galleries`, {
        method: 'POST',
        headers: bearer
          ? { authorization: bearer, 'content-type': 'application/json' }
          : { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      return { status: response.status, body: await response.json() }
    }
    expect(await post({ matchIds: [] }, auth)).toMatchObject({
      status: 400,
      body: { message: pickPublishedFootballMessage },
    })
    expect(await post({ matchIds: ['match-sample-final'] }, auth)).toMatchObject({
      status: 400,
      body: { message: onlyPublishedFootballMessage },
    })
    expect(
      await post({ matchIds: ['match-sample-league', 'match-sample-league'] }, auth),
    ).toMatchObject({ status: 400, body: { message: matchListedTwiceMessage } })
    expect(await post({ matchIds: ['match-sample-league'] })).toMatchObject({
      status: 401,
      body: { message: 'Invalid token' },
    })
    const created = await post({ matchIds: ['match-sample-league'] }, auth)
    expect(created.status).toBe(201)
    const id = created.body.id as string
    const read = await fetch(`http://127.0.0.1:${port}/api/galleries/${id}`, {
      headers: { authorization: auth },
    })
    const gallery = await read.json()
    expect(gallery.slides).toHaveLength(1)
    expect(gallery.slides[0].caption).toBe('')
    expect(JSON.stringify(gallery.slides[0].stats)).not.toContain('"number"')
    const patch = (body: unknown) =>
      fetch(`http://127.0.0.1:${port}/api/galleries/${id}/slides/0`, {
        method: 'PATCH',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
    expect((await (await patch({ caption: 'Sample night' })).json()).slides[0].caption).toBe(
      'Sample night',
    )
    expect((await (await patch({ caption: '' })).json()).slides[0].caption).toBe('')
    expect((await patch({ caption: 'x', note: 'y' })).status).toBe(400)
  })
})
