import { randomBytes } from 'node:crypto'
import { type ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { SignJWT } from 'jose'
import { describe, expect, it } from 'vite-plus/test'
import { AdminGuard, EditorGuard } from './role.guard.js'

const secret = randomBytes(32).toString('hex')
const editorGuard = new EditorGuard(secret)
const adminGuard = new AdminGuard(secret)

function context(authorization?: string): ExecutionContext {
  const headers = authorization === undefined ? {} : { authorization }
  return { switchToHttp: () => ({ getRequest: () => ({ headers }) }) } as ExecutionContext
}

async function bearer(role: string, exp: number | string = '1h'): Promise<string> {
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('editor-demo')
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(secret))
  return `Bearer ${token}`
}

describe('role guards', () => {
  it('allows an editor on editor routes and denies them on admin routes', async () => {
    const header = await bearer('editor')
    await expect(editorGuard.canActivate(context(header))).resolves.toBe(true)
    await expect(adminGuard.canActivate(context(header))).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('allows an admin on editor and admin routes', async () => {
    const header = await bearer('admin')
    await expect(editorGuard.canActivate(context(header))).resolves.toBe(true)
    await expect(adminGuard.canActivate(context(header))).resolves.toBe(true)
  })

  it('forbids a signed token whose role is not editor or admin', async () => {
    const header = await bearer('viewer')
    await expect(editorGuard.canActivate(context(header))).rejects.toBeInstanceOf(
      ForbiddenException,
    )
    await expect(adminGuard.canActivate(context(header))).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('rejects a missing, broken, or expired bearer', async () => {
    const expired = await bearer('admin', Math.floor(Date.now() / 1000) - 10)
    for (const header of [undefined, 'Bearer ', `${await bearer('admin')}x`, expired]) {
      await expect(editorGuard.canActivate(context(header))).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    }
  })
})
