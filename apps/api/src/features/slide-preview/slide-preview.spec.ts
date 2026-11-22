import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { EditorAuthGuard, JWT_SECRET } from '../../auth/role.guard.js'
import { CatalogError, openCatalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import { type CatalogDb } from '../../catalog/errors.js'
import { seedCatalog } from '../../catalog/seed.js'
import * as schema from '../../catalog/schema.js'
import { SlidePreviewController } from './slide-preview.controller.js'
import { previewPublishSlotSlides } from './slide-preview.js'

const SECRET = 'test-jwt-secret-that-is-at-least-32'
const SLOT_ID = 'publish-slot-sample-1530'

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

describe('slide-preview', () => {
  let close: (() => Promise<void>) | undefined
  afterEach(async () => {
    await close?.()
    close = undefined
  })

  it('renders ordered HTML, follows patch order, rejects unknown ids', async () => {
    const opened = await withDb()
    close = opened.close
    const preview = await previewPublishSlotSlides(opened.rows, SLOT_ID)
    expect(preview.slides.map((s) => [s.appearanceId, s.sportSlug])).toEqual([
      ['appearance-sample-tennis', 'tennis'],
      ['appearance-sample-football', 'football'],
    ])
    expect(preview.slides[0]?.html).toContain('Sample Player A')
    expect(preview.slides[1]?.html).toContain('Brkić')
    await opened.rows
      .update(schema.publishSlots)
      .set({ slideOrder: ['appearance-sample-football', 'appearance-sample-tennis'] })
      .where(eq(schema.publishSlots.id, SLOT_ID))
    expect(
      (await previewPublishSlotSlides(opened.rows, SLOT_ID)).slides.map((s) => s.appearanceId),
    ).toEqual(['appearance-sample-football', 'appearance-sample-tennis'])
    await opened.rows
      .update(schema.publishSlots)
      .set({ slideOrder: ['appearance-missing'] })
      .where(eq(schema.publishSlots.id, SLOT_ID))
    await expect(previewPublishSlotSlides(opened.rows, SLOT_ID)).rejects.toBeInstanceOf(
      CatalogError,
    )
    await expect(previewPublishSlotSlides(opened.rows, 'missing-slot')).rejects.toMatchObject({
      code: 'unknown-ref',
    })
  })

  it('routes: unauthorized rejected; editor gets previews', async () => {
    const client = new PGlite()
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    const seeded = await open()
    await seedCatalog(seeded)
    await seeded.close()
    const moduleRef = await Test.createTestingModule({
      controllers: [SlidePreviewController],
      providers: [
        { provide: CATALOG_OPENER, useValue: open },
        { provide: JWT_SECRET, useValue: SECRET },
        EditorAuthGuard,
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.init()
    await app.listen(0)
    const { port } = app.getHttpServer().address() as AddressInfo
    const path = `/api/editor/publish-slots/${SLOT_ID}/slide-previews`
    expect((await fetch(`http://127.0.0.1:${port}${path}`)).status).toBe(401)
    const token = await new SignJWT({ role: 'editor' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('editor-demo')
      .sign(new TextEncoder().encode(SECRET))
    const ok = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: { authorization: `Bearer ${token}` },
    })
    expect(ok.status).toBe(200)
    expect(
      ((await ok.json()) as { slides: { appearanceId: string }[] }).slides.map(
        (s) => s.appearanceId,
      ),
    ).toEqual(['appearance-sample-tennis', 'appearance-sample-football'])
    await app.close()
    await client.close()
  })
})
