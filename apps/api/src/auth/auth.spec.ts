import { randomBytes } from 'node:crypto'
import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { jwtVerify } from 'jose'
import { describe, expect, it } from 'vite-plus/test'
import { openCatalog } from '../catalog/catalog.js'
import * as schema from '../catalog/schema.js'
import { findCredential, hashPassword, login, savePasswordHash, type Sql } from './auth.js'
import { LoginController } from './login.controller.js'

const secret = randomBytes(32).toString('hex')
const password = randomBytes(12).toString('hex')

function store(passwordHash: string | null) {
  return {
    find: async (id: string) =>
      id === 'editor-demo' ? { id, role: 'editor' as const, passwordHash } : undefined,
  }
}

function pgliteSql(client: PGlite): Sql {
  return {
    async query(text, values) {
      const result = await client.query<Record<string, unknown>>(text, [...values])
      return { rows: result.rows, rowCount: result.rowCount ?? result.affectedRows ?? null }
    },
  }
}

describe('login', () => {
  it('rejects a wrong password, an unknown id, and a user with no hash', async () => {
    const hashed = store(await hashPassword(password))
    await expect(
      login(hashed, secret, { id: 'editor-demo', password: 'wrong-password' }),
    ).rejects.toThrow('Invalid credentials')
    await expect(login(hashed, secret, { id: 'unknown-user', password })).rejects.toThrow(
      'Invalid credentials',
    )
    await expect(login(store(null), secret, { id: 'editor-demo', password })).rejects.toThrow(
      'Invalid credentials',
    )
  })

  it('round-trips a hash through the credential column', async () => {
    const client = new PGlite()
    const catalog = await openCatalog(drizzle(client, { schema }), { close: () => client.close() })
    try {
      await catalog.write('user', { id: 'editor-demo', role: 'editor' })
      const sql = pgliteSql(client)
      await savePasswordHash(sql, 'editor-demo', await hashPassword(password))
      const stored = await findCredential(sql, 'editor-demo')
      expect(stored?.passwordHash?.startsWith('$2')).toBe(true)
      await expect(
        login({ find: (id) => findCredential(sql, id) }, secret, { id: 'editor-demo', password }),
      ).resolves.toHaveProperty('token')
    } finally {
      await catalog.close()
    }
  })

  it('returns a token from POST /api/login and 401 for a bad password', async () => {
    const previous = process.env.JWT_SECRET
    process.env.JWT_SECRET = secret
    try {
      const passwordHash = await hashPassword(password)
      const controller = new LoginController(async () => ({
        find: async (id: string) =>
          id === 'editor-demo' ? { id, role: 'editor', passwordHash } : undefined,
        close: async () => undefined,
      }))
      const ok = await controller.login({ id: 'editor-demo', password })
      expect(ok.token).not.toContain(password)
      const { payload } = await jwtVerify(ok.token, new TextEncoder().encode(secret))
      expect(payload).toMatchObject({ sub: 'editor-demo', role: 'editor' })
      await expect(
        controller.login({ id: 'editor-demo', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException)
      await expect(controller.login({ id: 'editor-demo' })).rejects.toBeInstanceOf(
        BadRequestException,
      )
    } finally {
      if (previous === undefined) delete process.env.JWT_SECRET
      else process.env.JWT_SECRET = previous
    }
  })
})
