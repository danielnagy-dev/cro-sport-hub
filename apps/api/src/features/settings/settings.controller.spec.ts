import { type AddressInfo } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { EditorAuthGuard, JWT_SECRET } from '../../auth/role.guard.js'
import { openCatalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import * as schema from '../../catalog/schema.js'
import { setupOpenApi } from '../../openapi.js'
import { CLOCK_TIME_MESSAGE, EMPTY_CLOCKS_MESSAGE, UNKNOWN_CLOCK_MESSAGE } from './settings.js'
import { SettingsController } from './settings.controller.js'

const secret = 'test-jwt-secret-that-is-at-least-32'
const SEEDED = [
  { id: 'slot-clock-1530', label: '15:30', clockTime: '15:30', sortOrder: 1, active: true },
  { id: 'slot-clock-2200', label: '22:00', clockTime: '22:00', sortOrder: 2, active: true },
]

describe('settings routes', () => {
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

  async function start(withOpenApi = false): Promise<number> {
    const client = new PGlite()
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    await (await open()).close()
    const moduleRef = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: CATALOG_OPENER, useValue: open },
        { provide: JWT_SECRET, useValue: secret },
        EditorAuthGuard,
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

  it('requires auth, lists stubs, patches clocks, and rejects invalid writes', async () => {
    const port = await start(true)
    const editor = await bearer('editor')
    const clocksPath = '/api/settings/publish-slot-clocks'
    const accountsPath = '/api/settings/connected-accounts'

    expect(await send(port, 'GET', clocksPath)).toMatchObject({
      status: 401,
      body: { message: 'Invalid token' },
    })
    expect(await send(port, 'PATCH', clocksPath, { clocks: SEEDED })).toMatchObject({
      status: 401,
      body: { message: 'Invalid token' },
    })

    expect(await send(port, 'GET', clocksPath, undefined, editor)).toEqual({
      status: 200,
      body: SEEDED,
    })
    expect(await send(port, 'GET', accountsPath, undefined, editor)).toEqual({
      status: 200,
      body: [
        { network: 'instagram', loginChecked: false },
        { network: 'facebook', loginChecked: false },
        { network: 'x', loginChecked: false },
      ],
    })

    const docs = await send(port, 'GET', '/docs-json')
    expect(docs.status).toBe(200)
    expect(docs.body.paths?.[clocksPath]?.get?.tags).toEqual(['settings'])

    expect(await send(port, 'PATCH', clocksPath, { clocks: [] }, editor)).toMatchObject({
      status: 400,
      body: { message: EMPTY_CLOCKS_MESSAGE },
    })
    expect(
      await send(
        port,
        'PATCH',
        clocksPath,
        { clocks: [{ ...SEEDED[0], clockTime: '9:00' }] },
        editor,
      ),
    ).toMatchObject({ status: 400, body: { message: CLOCK_TIME_MESSAGE } })
    expect(
      await send(
        port,
        'PATCH',
        clocksPath,
        { clocks: [{ ...SEEDED[0], id: 'slot-clock-missing' }] },
        editor,
      ),
    ).toMatchObject({ status: 404, body: { message: UNKNOWN_CLOCK_MESSAGE } })

    const patchBody = {
      clocks: [
        { ...SEEDED[0], label: 'Afternoon', clockTime: '16:15', active: true },
        { ...SEEDED[1], label: 'Night', clockTime: '22:30', active: false },
      ],
    }
    expect(await send(port, 'PATCH', clocksPath, patchBody, editor)).toEqual({
      status: 200,
      body: patchBody.clocks,
    })
    expect(await send(port, 'GET', clocksPath, undefined, editor)).toEqual({
      status: 200,
      body: patchBody.clocks,
    })
  })
})
