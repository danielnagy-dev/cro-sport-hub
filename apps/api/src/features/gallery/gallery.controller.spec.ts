import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { footballRendererReason } from '@cro-sport-hub/slide-generator'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { EditorAuthGuard, JWT_SECRET } from '../../auth/role.guard.js'
import { openCatalog } from '../../catalog/catalog.js'
import { seedCatalog } from '../../catalog/seed.js'
import * as schema from '../../catalog/schema.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import { GalleryController } from './gallery.controller.js'
import * as galleryModule from './gallery.js'
import {
  matchListedTwiceMessage,
  onlyPublishedFootballMessage,
  pickPublishedFootballMessage,
} from './gallery.js'

const secret = 'test-jwt-secret-that-is-at-least-32'
const pngHeader = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13])
const realRenderGalleryPngs = galleryModule.renderGalleryPngs

describe('gallery routes', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    vi.restoreAllMocks()
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

  it('stores rendered PNG bytes, serves them with auth, and reports missing Chromium', async () => {
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
    const create = await fetch(`http://127.0.0.1:${port}/api/galleries`, {
      method: 'POST',
      headers: { authorization: auth, 'content-type': 'application/json' },
      body: JSON.stringify({ matchIds: ['match-sample-league'] }),
    })
    const id = (await create.json()).id as string
    const pngUrl = `http://127.0.0.1:${port}/api/galleries/${id}/slides/0.png`
    const renderUrl = `http://127.0.0.1:${port}/api/galleries/${id}/render`
    const beforeRender = await fetch(pngUrl, { headers: { authorization: auth } })
    expect(beforeRender.status).toBe(404)
    expect((await beforeRender.json()).message).toBe('Slide is not rendered')
    expect((await fetch(renderUrl, { method: 'POST' })).status).toBe(401)
    expect((await fetch(pngUrl)).status).toBe(401)
    await fetch(`http://127.0.0.1:${port}/api/galleries/${id}/slides/0`, {
      method: 'PATCH',
      headers: { authorization: auth, 'content-type': 'application/json' },
      body: JSON.stringify({ caption: 'Sample night' }),
    })
    const rendererReason = footballRendererReason()
    if (rendererReason !== undefined) {
      const failed = await fetch(renderUrl, { method: 'POST', headers: { authorization: auth } })
      expect(failed.status).toBe(503)
      expect((await failed.json()).message).toBe(rendererReason)
      expect((await fetch(pngUrl, { headers: { authorization: auth } })).status).toBe(404)
      return
    }
    let renderedSlides: unknown
    vi.spyOn(galleryModule, 'renderGalleryPngs').mockImplementation((db, galleryId) =>
      realRenderGalleryPngs(db, galleryId, async (slides) => {
        renderedSlides = slides
        return slides.map(() => pngHeader)
      }),
    )
    const rendered = await fetch(renderUrl, { method: 'POST', headers: { authorization: auth } })
    expect(rendered.status).toBe(201)
    expect(await rendered.json()).toEqual({ slideCount: 1 })
    expect(JSON.stringify(renderedSlides)).toContain('Sample night')
    const png = await fetch(pngUrl, { headers: { authorization: auth } })
    expect(png.status).toBe(200)
    expect(png.headers.get('content-type')).toContain('image/png')
    const bytes = new Uint8Array(await png.arrayBuffer())
    expect(bytes.length).toBeGreaterThan(0)
    expect(Array.from(bytes.subarray(0, 4))).toEqual([137, 80, 78, 71])
  })
})
