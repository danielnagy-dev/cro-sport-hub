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
import { setupOpenApi } from '../../openapi.js'
import { editorAthleteSchema } from './editor-athlete.js'
import { EditorAthletesController } from './editor-athletes.controller.js'
import { createAthlete, listEditorAthletes, updateAthlete } from './editor-athletes.js'

const secret = 'test-jwt-secret-that-is-at-least-32'

describe('editor athletes helpers', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    await close?.()
    close = undefined
  })

  async function db(): Promise<CatalogDb> {
    const client = new PGlite()
    const database = drizzle(client, { schema })
    const catalog = await openCatalog(database)
    await seedCatalog(catalog)
    close = async () => {
      await catalog.close()
      await client.close()
    }
    return database
  }

  it('filters by sport and q, creates and updates, rejects bad writes', async () => {
    const rows = await db()
    expect(
      (await listEditorAthletes(rows, { sport: 'tennis', q: 'Player B' })).map((r) => r.id),
    ).toEqual(['sample-player-b'])
    expect(await listEditorAthletes(rows, { sport: 'basketball', q: 'NoSuchHooper' })).toEqual([])

    const created = await createAthlete(rows, {
      id: 'sample-hooper',
      slug: 'sample-hooper',
      name: 'Sample Hooper',
      sportId: 'sport-basketball',
      country: 'HR',
      clubName: 'Sample Ball Club',
    })
    expect(editorAthleteSchema.parse(created).clubName).toBe('Sample Ball Club')
    expect(
      (await updateAthlete(rows, 'sample-hooper', { ...created, name: 'Sample Hooper Jr' })).name,
    ).toBe('Sample Hooper Jr')

    await expect(createAthlete(rows, { id: 'bad' })).rejects.toBeInstanceOf(CatalogError)
    await expect(
      createAthlete(rows, {
        id: 'sample-player-a',
        slug: 'x',
        name: 'Dup',
        sportId: 'sport-tennis',
        country: 'HR',
      }),
    ).rejects.toMatchObject({ code: 'conflict' })
    await expect(
      updateAthlete(rows, 'missing', {
        id: 'missing',
        slug: 'missing',
        name: 'Missing',
        sportId: 'sport-tennis',
        country: 'HR',
      }),
    ).rejects.toMatchObject({ code: 'unknown-ref' })
  })
})

describe('editor tracked-athlete routes', () => {
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
      controllers: [EditorAthletesController],
      providers: [
        { provide: CATALOG_OPENER, useValue: open },
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

  it('auth, list/create/update, Zod fail-closed, and OpenAPI tag', async () => {
    const port = await start()
    const editor = await bearer('editor')
    const viewer = await bearer('viewer', 'viewer-demo')
    const body = {
      id: 'sample-racket',
      slug: 'sample-racket',
      name: 'Sample Racket',
      sportId: 'sport-tennis',
      country: 'HR',
      clubName: 'Sample Tennis Club',
    }

    expect(await send(port, 'POST', '/api/editor/tracked-athletes', body)).toMatchObject({
      status: 401,
    })
    expect(await send(port, 'POST', '/api/editor/tracked-athletes', body, viewer)).toMatchObject({
      status: 403,
    })
    expect(
      await send(port, 'GET', '/api/editor/tracked-athletes?sport=handball', undefined, editor),
    ).toMatchObject({ status: 400 })
    expect(
      await send(port, 'POST', '/api/editor/tracked-athletes', { ...body, slug: 'Bad' }, editor),
    ).toMatchObject({ status: 400 })

    const created = await send(port, 'POST', '/api/editor/tracked-athletes', body, editor)
    expect(created.status).toBe(201)
    expect(editorAthleteSchema.parse(created.body)).toEqual(body)

    const listed = await send(
      port,
      'GET',
      '/api/editor/tracked-athletes?sport=tennis&q=racket',
      undefined,
      editor,
    )
    expect(
      editorAthleteSchema
        .array()
        .parse(listed.body)
        .map((row) => row.id),
    ).toEqual(['sample-racket'])

    const updated = await send(
      port,
      'PUT',
      '/api/editor/tracked-athletes/sample-racket',
      { ...body, name: 'Sample Racket II' },
      await bearer('admin', 'admin-demo'),
    )
    expect(updated.status).toBe(200)
    expect(editorAthleteSchema.parse(updated.body).name).toBe('Sample Racket II')

    const docs = await send(port, 'GET', '/docs-json')
    const getTags = (docs.body as { paths?: Record<string, { get?: { tags?: string[] } }> })
      .paths?.['/api/editor/tracked-athletes']?.get?.tags
    expect(getTags).toEqual(['editor-athletes'])
  })
})
