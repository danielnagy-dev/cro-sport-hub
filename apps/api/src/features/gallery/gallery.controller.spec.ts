import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { unzipSync } from 'fflate'
import { footballRendererReason } from '@cro-sport-hub/slide-generator'
import { Test } from '@nestjs/testing'
import { eq, and } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { AdminAuthGuard, EditorAuthGuard, JWT_SECRET } from '../../auth/role.guard.js'
import { openCatalog } from '../../catalog/catalog.js'
import { type CatalogDb } from '../../catalog/errors.js'
import { seedCatalog } from '../../catalog/seed.js'
import * as schema from '../../catalog/schema.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import {
  createInMemoryPublicReadCacheClient,
  PUBLIC_READ_CACHE,
  type PublicReadCacheClient,
} from '../../public-read-cache/client.js'
import { publishedMatchesCacheKey } from '../../public-read-cache/published-matches.js'
import { setupOpenApi } from '../../openapi.js'
import { GalleryController } from './gallery.controller.js'
import * as galleryModule from './gallery.js'
import {
  GALLERY_SLIDES_NOT_RENDERED_MESSAGE,
  matchListedTwiceMessage,
  ONLY_APPROVED_DOWNLOAD_MESSAGE,
  onlyPublishedFootballMessage,
  pickPublishedFootballMessage,
} from './gallery.js'

const secret = 'test-jwt-secret-that-is-at-least-32'
const pngHeader = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13])
const pngHeaderSecond = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4])
const realRenderGalleryPngs = galleryModule.renderGalleryPngs

async function bearer(role: string, sub = 'editor-demo'): Promise<string> {
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret))
  return `Bearer ${token}`
}

describe('gallery routes', () => {
  let close: (() => Promise<void>) | undefined
  let rows: CatalogDb | undefined
  let cache: PublicReadCacheClient | undefined
  afterEach(async () => {
    vi.restoreAllMocks()
    await close?.()
    close = undefined
    rows = undefined
    cache = undefined
  })

  async function start(withOpenApi = false): Promise<number> {
    const client = new PGlite()
    const database = drizzle(client, { schema })
    rows = database
    cache = createInMemoryPublicReadCacheClient()
    const open: CatalogOpener = () => openCatalog(database)
    await seedCatalog(await open())
    const moduleRef = await Test.createTestingModule({
      controllers: [GalleryController],
      providers: [
        { provide: CATALOG_OPENER, useValue: open },
        { provide: PUBLIC_READ_CACHE, useValue: cache },
        { provide: JWT_SECRET, useValue: secret },
        EditorAuthGuard,
        AdminAuthGuard,
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    if (withOpenApi) setupOpenApi(app)
    await app.listen(0, '127.0.0.1')
    close = async () => {
      await app.close()
      await client.close()
    }
    return (app.getHttpServer().address() as AddressInfo).port
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

  async function createDraft(port: number, token: string): Promise<string> {
    const created = await send(
      port,
      'POST',
      '/api/galleries',
      { matchIds: ['match-sample-league'] },
      token,
    )
    expect(created.status).toBe(201)
    return created.body.id as string
  }

  async function stored(id: string) {
    if (rows === undefined) throw new Error('Expected the test database')
    const row = (await rows.select().from(schema.galleries).where(eq(schema.galleries.id, id)))[0]
    if (row === undefined) throw new Error('Expected a gallery row')
    return {
      id: row.id,
      status: row.status,
      ...(row.reviewedBy === null ? {} : { reviewedBy: row.reviewedBy }),
      ...(row.publishedAt === null ? {} : { publishedAt: row.publishedAt }),
    }
  }

  it('creates a draft, validates match ids, edits captions, and requires auth', async () => {
    const port = await start()
    const auth = await bearer('editor')
    const post = async (body: unknown, bearerToken?: string) =>
      send(port, 'POST', '/api/galleries', body, bearerToken)
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
    const port = await start()
    const auth = await bearer('editor')
    const id = await createDraft(port, auth)
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

  it('submits, rejects, and publishes without touching the public match cache', async () => {
    const port = await start(true)
    const editor = await bearer('editor')
    const admin = await bearer('admin', 'admin-demo')
    const id = await createDraft(port, editor)
    const submit = `/api/galleries/${id}/submit`
    const reject = `/api/galleries/${id}/reject`
    const publish = `/api/galleries/${id}/publish`
    const cacheKey = publishedMatchesCacheKey({ limit: 20, offset: 0 })
    if (cache === undefined) throw new Error('Expected the public read cache')
    await cache.set(cacheKey, '{}', 60)

    expect(await send(port, 'POST', submit)).toMatchObject({
      status: 401,
      body: { message: 'Invalid token' },
    })
    expect(await send(port, 'POST', reject, undefined, editor)).toMatchObject({
      status: 403,
      body: { message: 'Forbidden' },
    })
    expect(await send(port, 'POST', publish, undefined, editor)).toMatchObject({
      status: 403,
      body: { message: 'Forbidden' },
    })
    expect(await send(port, 'POST', reject, undefined, admin)).toMatchObject({
      status: 409,
      body: { message: 'Only a gallery in review can be rejected' },
    })
    expect(await send(port, 'POST', publish, undefined, admin)).toMatchObject({
      status: 409,
      body: { message: 'Only a gallery in review can be published' },
    })

    expect(await send(port, 'POST', submit, undefined, editor)).toMatchObject({
      status: 200,
      body: { id, status: 'review' },
    })
    const reviewing = await stored(id)
    expect(reviewing).toMatchObject({ id, status: 'review' })
    expect(reviewing).not.toHaveProperty('reviewedBy')
    expect(reviewing).not.toHaveProperty('publishedAt')
    expect(await send(port, 'POST', submit, undefined, editor)).toMatchObject({
      status: 409,
      body: { message: 'Only a draft gallery can be submitted' },
    })

    if (rows === undefined) throw new Error('Expected the test database')
    await rows
      .update(schema.galleries)
      .set({ reviewedBy: 'admin-demo' })
      .where(eq(schema.galleries.id, id))

    expect(await send(port, 'POST', reject, undefined, admin)).toMatchObject({
      status: 200,
      body: { id, status: 'draft' },
    })
    const reopened = await stored(id)
    expect(reopened).toMatchObject({ id, status: 'draft' })
    expect(reopened).not.toHaveProperty('reviewedBy')
    expect(reopened).not.toHaveProperty('publishedAt')

    expect(await send(port, 'POST', submit, undefined, admin)).toMatchObject({
      status: 200,
      body: { id, status: 'review' },
    })

    expect(await send(port, 'POST', publish, undefined, admin)).toMatchObject({
      status: 200,
      body: { id, status: 'published' },
    })
    const published = await stored(id)
    expect(published).toMatchObject({ id, status: 'published', reviewedBy: 'admin-demo' })
    expect(published.publishedAt).toMatch(/[+-]\d{2}:\d{2}$/)
    expect(await cache.get(cacheKey)).toBe('{}')
    expect(await send(port, 'POST', publish, undefined, admin)).toMatchObject({
      status: 409,
      body: { message: 'Only a gallery in review can be published' },
    })

    expect(
      await send(port, 'POST', '/api/galleries/gallery-missing/submit', undefined, editor),
    ).toMatchObject({ status: 404, body: { message: 'Unknown gallery' } })
    expect(
      await send(port, 'POST', '/api/galleries/gallery-missing/reject', undefined, admin),
    ).toMatchObject({ status: 404, body: { message: 'Unknown gallery' } })
    expect(
      await send(port, 'POST', '/api/galleries/gallery-missing/publish', undefined, admin),
    ).toMatchObject({ status: 404, body: { message: 'Unknown gallery' } })

    const docs = await send(port, 'GET', '/docs-json')
    const paths = docs.body.paths
    expect(paths['/api/galleries/{id}/submit'].post.security).toEqual([{ bearer: [] }])
    expect(paths['/api/galleries/{id}/reject'].post.security).toEqual([{ bearer: [] }])
    expect(paths['/api/galleries/{id}/publish'].post.security).toEqual([{ bearer: [] }])
  }, 20_000)

  it('downloads a published gallery as an ordered ZIP and rejects other states', async () => {
    const port = await start(true)
    const editor = await bearer('editor')
    const admin = await bearer('admin', 'admin-demo')
    const id = await createDraft(port, editor)
    const download = `/api/galleries/${id}/download`

    expect(await send(port, 'GET', download)).toMatchObject({
      status: 401,
      body: { message: 'Invalid token' },
    })
    expect(await send(port, 'GET', download, undefined, editor)).toMatchObject({
      status: 409,
      body: { message: ONLY_APPROVED_DOWNLOAD_MESSAGE },
    })

    await send(port, 'POST', `/api/galleries/${id}/submit`, undefined, editor)
    expect(await send(port, 'GET', download, undefined, editor)).toMatchObject({
      status: 409,
      body: { message: ONLY_APPROVED_DOWNLOAD_MESSAGE },
    })

    await send(port, 'POST', `/api/galleries/${id}/publish`, undefined, admin)
    expect(await send(port, 'GET', download, undefined, editor)).toMatchObject({
      status: 409,
      body: { message: GALLERY_SLIDES_NOT_RENDERED_MESSAGE },
    })

    if (rows === undefined) throw new Error('Expected the test database')
    const firstSlide = (
      await rows.select().from(schema.gallerySlides).where(eq(schema.gallerySlides.galleryId, id))
    )[0]
    if (firstSlide === undefined) throw new Error('Expected a gallery slide row')
    await rows.insert(schema.gallerySlides).values({
      galleryId: id,
      slideIndex: 1,
      matchId: firstSlide.matchId,
      caption: null,
      payload: firstSlide.payload,
      png: null,
    })
    await rows
      .update(schema.gallerySlides)
      .set({ png: Buffer.from(pngHeader) })
      .where(and(eq(schema.gallerySlides.galleryId, id), eq(schema.gallerySlides.slideIndex, 0)))
    await rows
      .update(schema.gallerySlides)
      .set({ png: Buffer.from(pngHeaderSecond) })
      .where(and(eq(schema.gallerySlides.galleryId, id), eq(schema.gallerySlides.slideIndex, 1)))

    const zipResponse = await fetch(`http://127.0.0.1:${port}${download}`, {
      headers: { authorization: editor },
    })
    expect(zipResponse.status).toBe(200)
    expect(zipResponse.headers.get('content-type')).toContain('application/zip')
    const entries = unzipSync(new Uint8Array(await zipResponse.arrayBuffer()))
    expect(Object.keys(entries).sort()).toEqual(['01.png', '02.png'])
    expect(Array.from(entries['01.png'].subarray(0, 4))).toEqual([137, 80, 78, 71])
    expect(Array.from(entries['02.png'])).toEqual(Array.from(pngHeaderSecond))

    expect(
      await send(port, 'GET', '/api/galleries/gallery-missing/download', undefined, editor),
    ).toMatchObject({ status: 404, body: { message: 'Unknown gallery' } })

    const docs = await send(port, 'GET', '/docs-json')
    expect(docs.body.paths['/api/galleries/{id}/download'].get.security).toEqual([{ bearer: [] }])
  })
})
