import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { EditorAuthGuard, JWT_SECRET } from '../../auth/role.guard.js'
import { CatalogError, openCatalog } from '../../catalog/catalog.js'
import { type CatalogDb } from '../../catalog/errors.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import * as schema from '../../catalog/schema.js'
import { seedCatalog } from '../../catalog/seed.js'
import { SourcesController } from './sources.controller.js'
import {
  attachAppearanceSource,
  createSource,
  listAppearanceSources,
  setAppearanceSourceDisagreement,
} from './sources.js'

const SECRET = 'test-jwt-secret-that-is-at-least-32'
const APPEARANCE_ID = 'appearance-sample-tennis'

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

function sourceBody(overrides: Record<string, unknown> = {}) {
  return {
    id: 'src-manual-1',
    url: 'https://example.com/results/sample',
    fetchedAt: '2026-11-22T12:00:00.000Z',
    creatorKind: 'manual',
    ...overrides,
  }
}

describe('sources', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    await close?.()
    close = undefined
  })

  it('helpers: create, attach, list, disagreement, Zod rejects', async () => {
    const opened = await withDb()
    close = opened.close
    const rows = opened.rows
    const created = await createSource(rows, sourceBody())
    expect(created).toMatchObject({
      id: 'src-manual-1',
      url: 'https://example.com/results/sample',
      fetchedAt: '2026-11-22T12:00:00+00:00',
      creatorKind: 'manual',
    })
    const attached = await attachAppearanceSource(rows, {
      appearanceId: APPEARANCE_ID,
      sourceId: created.id,
    })
    expect(attached).toMatchObject({
      appearanceId: APPEARANCE_ID,
      sourceId: 'src-manual-1',
      url: 'https://example.com/results/sample',
      disagrees: false,
    })
    expect(await listAppearanceSources(rows, APPEARANCE_ID)).toEqual([attached])
    expect(
      await setAppearanceSourceDisagreement(rows, APPEARANCE_ID, created.id, {
        disagrees: true,
        fieldPath: 'opponentLabel',
      }),
    ).toMatchObject({ disagrees: true, fieldPath: 'opponentLabel' })
    const cleared = await setAppearanceSourceDisagreement(rows, APPEARANCE_ID, created.id, {
      disagrees: false,
    })
    expect(cleared).toMatchObject({ disagrees: false })
    expect(cleared.fieldPath).toBeUndefined()
    await expect(createSource(rows, sourceBody({ id: 'bad-url', url: '' }))).rejects.toBeInstanceOf(
      CatalogError,
    )
    await expect(attachAppearanceSource(rows, { sourceId: created.id })).rejects.toMatchObject({
      code: 'invalid',
    })
  })

  it('routes: unauthorized write rejected; auth create+attach', async () => {
    const client = new PGlite()
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    const seeded = await open()
    await seedCatalog(seeded)
    await seeded.close()
    const moduleRef = await Test.createTestingModule({
      controllers: [SourcesController],
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
    const body = sourceBody({ id: 'src-route-a' })
    expect((await send('POST', '/api/editor/sources', body)).status).toBe(401)
    expect((await send('POST', '/api/editor/sources', body, editor)).status).toBe(201)
    expect(
      (
        await send(
          'POST',
          '/api/editor/sources/attachments',
          { appearanceId: APPEARANCE_ID, sourceId: 'src-route-a' },
          editor,
        )
      ).status,
    ).toBe(201)
    const listed = await send(
      'GET',
      `/api/editor/sources?appearanceId=${APPEARANCE_ID}`,
      undefined,
      editor,
    )
    expect(listed.status).toBe(200)
    expect(JSON.parse(listed.body)).toEqual([
      expect.objectContaining({
        appearanceId: APPEARANCE_ID,
        sourceId: 'src-route-a',
        disagrees: false,
      }),
    ])
  })
})
