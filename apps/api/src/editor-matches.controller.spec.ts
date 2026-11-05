import { type AddressInfo } from 'node:net'
import { editorMatchPageSchema, type EditorMatch } from '@cro-sport-hub/shared-types'
import { PGlite } from '@electric-sql/pglite'
import { Test } from '@nestjs/testing'
import { drizzle } from 'drizzle-orm/pglite'
import { SignJWT } from 'jose'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { EditorAuthGuard, JWT_SECRET } from './auth/role.guard.js'
import { openCatalog, type Catalog } from './catalog/catalog.js'
import { seedCatalog } from './catalog/seed.js'
import * as schema from './catalog/schema.js'
import { EditorMatchesController } from './editor-matches.controller.js'
import { CATALOG_OPENER, type CatalogOpener } from './catalog/catalog.module.js'
import { MatchesController } from './matches.controller.js'
import {
  createInMemoryPublicReadCacheClient,
  PUBLIC_READ_CACHE,
} from './public-read-cache/client.js'
import { setupOpenApi } from './openapi.js'

const secret = 'test-jwt-secret-that-is-at-least-32'
const queryMessage =
  'sport is tennis or football, status is draft, review, or published, source is manual or import, limit is 1 to 50, and offset is 0 or greater'

function listed(items: readonly EditorMatch[], total: number, limit = 20, offset = 0) {
  return { items, limit, offset, total }
}

function item(
  id: string,
  sport: EditorMatch['sport'],
  competition: string,
  date: string,
  round: string,
  status: EditorMatch['status'],
  label: string,
): EditorMatch {
  return { id, sport, competition, date, round, status, source: 'manual', label }
}

const league = item(
  'match-sample-league',
  'football',
  'Sample League',
  '2026-10-19',
  'Matchday 8',
  'published',
  'Sample Home vs Sample Away',
)
const final = item(
  'match-sample-final',
  'tennis',
  'Sample Cup',
  '2026-10-18',
  'Final',
  'published',
  'Sample Player A vs Sample Player B',
)
const quarter = item(
  'match-sample-qf',
  'tennis',
  'Sample Cup',
  '2026-10-16',
  'QF',
  'draft',
  'Sample Player C vs Sample Player D',
)
const later = item(
  'match-sample-later',
  'football',
  'Sample League',
  '2026-10-22',
  'Matchday 9',
  'draft',
  'Sample Home vs Sample Town',
)

describe('editorial match list', () => {
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

  async function start(seedMore?: (catalog: Catalog) => Promise<void>): Promise<number> {
    const client = new PGlite()
    const open: CatalogOpener = () => openCatalog(drizzle(client, { schema }))
    const catalog = await open()
    await seedCatalog(catalog)
    await seedMore?.(catalog)
    await catalog.close()
    const moduleRef = await Test.createTestingModule({
      controllers: [EditorMatchesController, MatchesController],
      providers: [
        { provide: CATALOG_OPENER, useValue: open },
        { provide: PUBLIC_READ_CACHE, useValue: createInMemoryPublicReadCacheClient() },
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
    const address = app.getHttpServer().address() as AddressInfo | null
    if (!address) throw new Error('Expected the test server to be listening')
    return address.port
  }

  async function send(port: number, path: string, token?: string) {
    return fetch(`http://127.0.0.1:${port}${path}`, {
      headers: token === undefined ? {} : { authorization: token },
    })
  }

  async function page(port: number, path: string, token: string) {
    const response = await send(port, path, token)
    expect(response.status).toBe(200)
    return editorMatchPageSchema.parse(await response.json())
  }

  async function draftFootball(
    catalog: Catalog,
    row: EditorMatch,
    homeTeamId: string,
    awayTeamId: string,
  ) {
    await catalog.write('match', {
      id: row.id,
      sportId: 'sport-football',
      competitionId: 'comp-sample-league',
      date: row.date,
      round: row.round,
      status: 'draft',
      source: 'manual',
      createdBy: 'editor-demo',
    })
    await catalog.write('footballMatch', {
      matchId: row.id,
      homeTeamId,
      awayTeamId,
      homeGoals: 1,
      awayGoals: 0,
    })
  }

  it('lists drafts and published rows newest first, with labels and no club id', async () => {
    const port = await start(async (catalog) => {
      await draftFootball(catalog, later, 'club-sample-home', 'club-sample-town')
    })
    const body = await page(port, '/api/editor/matches', await bearer('editor'))
    expect(body).toEqual(listed([later, league, final, quarter], 4))
    const text = JSON.stringify(body)
    expect(text).not.toContain('club-sample')
    expect(text).not.toContain('homeGoals')
  }, 20_000)

  it('filters by status, sport, and source', async () => {
    const port = await start()
    const token = await bearer('admin', 'admin-demo')
    await expect(page(port, '/api/editor/matches?status=draft', token)).resolves.toEqual(
      listed([quarter], 1),
    )
    const football = await page(port, '/api/editor/matches?sport=football', token)
    expect(football.items).toEqual([league])
    expect(JSON.stringify(football)).not.toContain('Sample Player')
    await expect(page(port, '/api/editor/matches?source=import', token)).resolves.toEqual(
      listed([], 0),
    )
    await expect(page(port, '/api/editor/matches?limit=1&offset=1', token)).resolves.toEqual(
      listed([final], 3, 1, 1),
    )
  }, 20_000)

  it('rejects a bad query or a missing role, and leaves the public list published-only', async () => {
    const port = await start()
    const editor = await bearer('editor')
    const bad = await send(port, '/api/editor/matches?limit=0', editor)
    expect(bad.status).toBe(400)
    await expect(bad.json()).resolves.toMatchObject({ message: queryMessage })
    expect((await send(port, '/api/editor/matches?sport=curling', editor)).status).toBe(400)
    const missing = await send(port, '/api/editor/matches')
    expect(missing.status).toBe(401)
    await expect(missing.json()).resolves.toMatchObject({ message: 'Invalid token' })
    const viewer = await send(port, '/api/editor/matches', await bearer('viewer'))
    expect(viewer.status).toBe(403)
    await expect(viewer.json()).resolves.toMatchObject({ message: 'Forbidden' })

    const published = await send(port, '/api/matches')
    expect(published.status).toBe(200)
    const publicText = await published.text()
    expect(publicText).not.toContain('match-sample-qf')
    expect(publicText).toContain('match-sample-final')
    expect(publicText).toContain('match-sample-league')

    const docs = await send(port, '/docs-json')
    expect(docs.status).toBe(200)
    const paths = (await docs.json()).paths
    expect(paths['/api/editor/matches'].get.security).toEqual([{ bearer: [] }])
    expect(paths['/api/matches'].get.security).toBeUndefined()
  }, 20_000)

  it('reads a tennis draft and rejects a football id without a token', async () => {
    const port = await start()
    const editor = await bearer('editor')
    const read = await send(port, '/api/editor/matches/tennis/match-sample-qf', editor)
    expect(read.status).toBe(200)
    const body = await read.json()
    expect(body).toMatchObject({
      id: 'match-sample-qf',
      status: 'draft',
      playerAId: 'sample-player-c',
      playerBId: 'sample-player-d',
      winnerId: 'sample-player-c',
      bestOf: 3,
      score: [
        [6, 3],
        [4, 2],
      ],
      retired: true,
    })
    expect(body).not.toHaveProperty('firstServePct')
    expect(JSON.stringify(body)).not.toContain('Pct')

    const football = await send(port, '/api/editor/matches/tennis/match-sample-league', editor)
    expect(football.status).toBe(404)
    await expect(football.json()).resolves.toMatchObject({ message: 'Unknown match' })

    const missing = await send(port, '/api/editor/matches/tennis/match-sample-qf')
    expect(missing.status).toBe(401)
    await expect(missing.json()).resolves.toMatchObject({ message: 'Invalid token' })

    const docs = await send(port, '/docs-json')
    expect(docs.status).toBe(200)
    expect((await docs.json()).paths['/api/editor/matches/tennis/{id}'].get.security).toEqual([
      { bearer: [] },
    ])
  }, 20_000)

  it('reads a football draft with appearances and rejects a tennis id', async () => {
    const port = await start()
    const editor = await bearer('editor')
    const read = await send(port, '/api/editor/matches/football/match-sample-league', editor)
    expect(read.status).toBe(200)
    const body = await read.json()
    expect(body).toMatchObject({
      id: 'match-sample-league',
      competitionId: 'comp-sample-league',
      date: '2026-10-19',
      round: 'Matchday 8',
      homeTeamId: 'club-sample-home',
      awayTeamId: 'club-sample-away',
      homeGoals: 2,
      awayGoals: 1,
      status: 'published',
    })
    expect(body).not.toHaveProperty('score')
    expect(body).not.toHaveProperty('playerAId')
    const appearances = (body as { appearances?: unknown[] }).appearances
    expect(appearances).toHaveLength(5)
    expect(appearances).toEqual(
      expect.arrayContaining([
        {
          athleteId: 'karlo-brkic',
          teamId: 'club-sample-home',
          started: true,
          minutes: 90,
          goals: 2,
          assists: 0,
          yellowCards: 0,
          redCard: false,
        },
      ]),
    )
    expect(JSON.stringify(body)).not.toContain('matchId')

    const tennis = await send(port, '/api/editor/matches/football/match-sample-final', editor)
    expect(tennis.status).toBe(404)
    await expect(tennis.json()).resolves.toMatchObject({ message: 'Unknown match' })

    const missing = await send(port, '/api/editor/matches/football/match-sample-league')
    expect(missing.status).toBe(401)
    await expect(missing.json()).resolves.toMatchObject({ message: 'Invalid token' })

    const docs = await send(port, '/docs-json')
    expect(docs.status).toBe(200)
    expect((await docs.json()).paths['/api/editor/matches/football/{id}'].get.security).toEqual([
      { bearer: [] },
    ])
  }, 20_000)
})
