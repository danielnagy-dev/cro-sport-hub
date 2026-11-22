import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { EditorAuthGuard, JWT_SECRET } from '../../auth/role.guard.js'
import { CatalogError, openCatalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import { type CatalogDb } from '../../catalog/errors.js'
import { seedCatalog } from '../../catalog/seed.js'
import * as schema from '../../catalog/schema.js'
import { PublishSlotsController } from './publish-slots.controller.js'
import {
  approvePublishSlot,
  getNextPublishSlot,
  listPublishSlotsForDay,
  patchPublishSlot,
} from './publish-slots.js'
const SECRET = 'test-jwt-secret-that-is-at-least-32'
const SLOT_ID = 'publish-slot-sample-1530'
const DAY = '2026-11-22'
const AT = '2026-11-22T12:00:00.000Z'
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
async function insertThreePosts(db: CatalogDb): Promise<void> {
  await db.insert(schema.networkPosts).values(
    (['instagram', 'facebook', 'x'] as const).map((network) => ({
      id: `np-${SLOT_ID}-${network}`,
      publishSlotId: SLOT_ID,
      network,
      bodyText: `${network} draft`,
      status: 'ready_for_review' as const,
      externalPostId: null,
      creatorKind: 'manual' as const,
      createdAt: AT,
      updatedAt: AT,
    })),
  )
}

describe('publish-slots', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    await close?.()
    close = undefined
  })

  it('helpers: list, next, patch, approve, zod rejects', async () => {
    const opened = await withDb()
    close = opened.close
    const db = opened.rows
    await insertThreePosts(db)
    const listed = await listPublishSlotsForDay(db, { day: DAY })
    expect(listed[0]?.clockTime).toBe('15:30')
    expect(listed[0]?.networkPosts.map((p) => p.network).sort()).toEqual([
      'facebook',
      'instagram',
      'x',
    ])
    expect((await getNextPublishSlot(db, { day: DAY, clockTime: '12:00' }))?.id).toBe(SLOT_ID)
    const patched = await patchPublishSlot(db, SLOT_ID, {
      slideOrder: ['appearance-sample-tennis'],
      networkPosts: [
        { network: 'instagram', bodyText: 'IG copy', externalPostId: 'ig-ext-1' },
        { network: 'x', status: 'error' },
      ],
    })
    expect(patched.networkPosts.find((p) => p.network === 'instagram')).toMatchObject({
      bodyText: 'IG copy',
      externalPostId: 'ig-ext-1',
    })
    expect((await approvePublishSlot(db, SLOT_ID)).status).toBe('approved')
    await expect(
      patchPublishSlot(db, SLOT_ID, { networkPosts: [{ network: 'tiktok' }] }),
    ).rejects.toBeInstanceOf(CatalogError)
    await expect(approvePublishSlot(db, 'missing-slot')).rejects.toMatchObject({
      code: 'unknown-ref',
    })
  })

  it('routes: unauthorized write rejected', async () => {
    const client = new PGlite()
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    const seeded = await open()
    await seedCatalog(seeded)
    await insertThreePosts(drizzle(client, { schema }))
    await seeded.close()
    const moduleRef = await Test.createTestingModule({
      controllers: [PublishSlotsController],
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
      return response.status
    }
    const editor = `Bearer ${await new SignJWT({ role: 'editor' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('editor-demo')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(SECRET))}`
    const body = { slideOrder: ['appearance-sample-football'] }
    expect(await send('PATCH', `/api/editor/publish-slots/${SLOT_ID}`, body)).toBe(401)
    expect(await send('POST', `/api/editor/publish-slots/${SLOT_ID}/approve`)).toBe(401)
    expect(await send('PATCH', `/api/editor/publish-slots/${SLOT_ID}`, body, editor)).toBe(200)
    expect(
      await send('POST', `/api/editor/publish-slots/${SLOT_ID}/approve`, undefined, editor),
    ).toBe(200)
  })
})
