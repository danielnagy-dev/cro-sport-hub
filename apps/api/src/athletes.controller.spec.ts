import { type AddressInfo } from 'node:net'
import { athleteNameListSchema, publicAthleteSchema } from '@cro-sport-hub/shared-types'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { AthletesController } from './athletes.controller.js'
import { openCatalog } from './catalog/catalog.js'
import { seedCatalog } from './catalog/seed.js'
import * as schema from './catalog/schema.js'
import { CATALOG_OPENER, type CatalogOpener } from './catalog/catalog.module.js'
import { setupOpenApi } from './openapi.js'

const karlo = {
  slug: 'karlo-brkic',
  name: 'Karlo Brkić',
  sport: 'football' as const,
  country: 'HR',
  position: 'Forward',
  clubs: [
    { name: 'Sample Home', from: '2025-07-01' },
    { name: 'Sample Town', from: '2023-07-01', to: '2025-06-30' },
  ],
}
const playerA = {
  slug: 'sample-player-a',
  name: 'Sample Player A',
  sport: 'tennis' as const,
  country: 'HR',
  clubs: [],
}
const footballNames = [
  { slug: 'bruno-peric', name: 'Bruno Perić' },
  { slug: 'filip-saric', name: 'Filip Šarić' },
  { slug: 'karlo-brkic', name: 'Karlo Brkić' },
  { slug: 'leon-vukovic', name: 'Leon Vuković' },
  { slug: 'mateo-jurcic', name: 'Mateo Jurčić' },
]

type ApiDocument = {
  paths?: Record<string, { get?: { responses?: Record<string, { description?: string }> } }>
}

function notFound(document: ApiDocument, path: string): string | undefined {
  return document.paths?.[path]?.get?.responses?.['404']?.description
}

describe('public athletes', () => {
  let close: (() => Promise<void>) | undefined

  afterEach(async () => {
    await close?.()
    close = undefined
  })

  async function start(): Promise<number> {
    const client = new PGlite()
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    const catalog = await open()
    await seedCatalog(catalog)
    await catalog.close()

    const moduleRef = await Test.createTestingModule({
      controllers: [AthletesController],
      providers: [{ provide: CATALOG_OPENER, useValue: open }],
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

  async function body(port: number, path: string) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`)
    expect(response.status).toBe(200)
    return response.json() as Promise<unknown>
  }

  it('returns the profile and club names, and 404 for an unknown slug', async () => {
    const port = await start()
    const footballer = publicAthleteSchema.parse(await body(port, '/api/athletes/karlo-brkic'))
    expect(footballer).toEqual(karlo)
    const footballText = JSON.stringify(footballer)
    expect(footballText).not.toContain('club-sample')
    expect(footballText).not.toContain('sample-home')
    expect(footballText).not.toContain('sample-town')
    expect(footballText).not.toContain('crest')
    expect(footballer).not.toHaveProperty('results')

    const tennis = publicAthleteSchema.parse(await body(port, '/api/athletes/sample-player-a'))
    expect(tennis).toEqual(playerA)
    expect(tennis).not.toHaveProperty('results')

    const missing = await fetch(`http://127.0.0.1:${port}/api/athletes/nobody`)
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toMatchObject({ message: 'Unknown athlete' })

    const docs = await fetch(`http://127.0.0.1:${port}/docs-json`)
    expect(docs.status).toBe(200)
    const document = (await docs.json()) as ApiDocument
    expect(notFound(document, '/api/athletes/{slug}')).toBe('Unknown athlete')
  }, 20_000)

  it('lists one sport by name and 404s an unknown sport', async () => {
    const port = await start()
    const listed = athleteNameListSchema.parse(await body(port, '/api/athletes?sport=football'))
    expect(listed).toEqual(footballNames)
    const text = JSON.stringify(listed)
    expect(text).not.toContain('sample-player')
    expect(text).not.toContain('results')

    const curling = await fetch(`http://127.0.0.1:${port}/api/athletes?sport=curling`)
    expect(curling.status).toBe(404)
    await expect(curling.json()).resolves.toMatchObject({ message: 'Unknown sport' })

    const docs = await fetch(`http://127.0.0.1:${port}/docs-json`)
    expect(docs.status).toBe(200)
    const document = (await docs.json()) as ApiDocument
    expect(notFound(document, '/api/athletes')).toBe('Unknown sport')
  }, 20_000)
})
