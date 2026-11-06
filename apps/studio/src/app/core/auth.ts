import { HttpClient, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http'
import { inject, InjectionToken, Injector } from '@angular/core'
import { type CanActivateFn, Router } from '@angular/router'
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import { catchError, firstValueFrom, throwError } from 'rxjs'
import { roleSchema, type Role } from '@cro-sport-hub/shared-types'

/** JWT `exp` is seconds. The studio reads claims and does not check the signature. */
export type Session = { token: string; id: string; role: Role; exp: number }
export type SignInResult = 'ok' | 'invalid' | 'rejected'

export const loginPath = '/api/login'
const STORAGE_KEY = 'studio.token'

export type TokenStore = {
  read(): string | null
  write(token: string): void
  clear(): void
}

export const TOKEN_STORE = new InjectionToken<TokenStore>('TOKEN_STORE', {
  factory: () => ({
    read: () => sessionStorage.getItem(STORAGE_KEY),
    write: (token) => sessionStorage.setItem(STORAGE_KEY, token),
    clear: () => sessionStorage.removeItem(STORAGE_KEY),
  }),
})

type AuthState = { session: Session | null }

const signedOut: AuthState = { session: null }
let expiry: ReturnType<typeof setTimeout> | undefined

function clearExpiry(): void {
  if (expiry === undefined) return
  clearTimeout(expiry)
  expiry = undefined
}

function armExpiry(exp: number, onExpire: () => void): void {
  clearExpiry()
  const delay = exp * 1000 - Date.now()
  if (delay <= 0) {
    onExpire()
    return
  }
  expiry = setTimeout(() => {
    expiry = undefined
    onExpire()
  }, delay)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function padBase64Url(segment: string): string {
  const base64 = segment.replaceAll('-', '+').replaceAll('_', '/')
  return base64 + '='.repeat((4 - (base64.length % 4)) % 4)
}

function decodePayload(token: string): unknown {
  const segment = token.split('.').at(1)
  if (segment === undefined || segment.length === 0) return undefined
  try {
    const json: unknown = JSON.parse(atob(padBase64Url(segment)))
    return json
  } catch {
    return undefined
  }
}

export function readSession(token: string, now: number): Session | undefined {
  const payload = decodePayload(token)
  if (!isRecord(payload)) return undefined
  const role = roleSchema.safeParse(payload['role'])
  const sub = payload['sub']
  const exp = payload['exp']
  if (typeof sub !== 'string' || sub.length === 0 || typeof exp !== 'number' || !role.success) {
    return undefined
  }
  if (exp * 1000 <= now) return undefined
  return { token, id: sub, role: role.data, exp }
}

function readToken(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined
  const token = body['token']
  return typeof token === 'string' && token.length > 0 ? token : undefined
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(signedOut),
  withMethods((store, tokens = inject(TOKEN_STORE), injector = inject(Injector)) => {
    function logOut(): void {
      clearExpiry()
      tokens.clear()
      patchState(store, signedOut)
    }

    return {
      logOut,
      dropIfExpired(): void {
        const session = store.session()
        if (session !== null && session.exp * 1000 <= Date.now()) logOut()
      },
      async signIn(input: { id: string; password: string }): Promise<SignInResult> {
        try {
          const body: unknown = await firstValueFrom(
            injector.get(HttpClient).post(loginPath, input),
          )
          const token = readToken(body)
          const session = token === undefined ? undefined : readSession(token, Date.now())
          if (session === undefined) return 'rejected'
          tokens.write(session.token)
          patchState(store, { session })
          armExpiry(session.exp, logOut)
          return store.session() === null ? 'rejected' : 'ok'
        } catch (error) {
          if (
            error instanceof HttpErrorResponse &&
            (error.status === 401 || error.status === 400)
          ) {
            return 'invalid'
          }
          return 'rejected'
        }
      },
    }
  }),
  withHooks({
    onInit(store, tokens = inject(TOKEN_STORE)) {
      const saved = tokens.read()
      if (saved === null) return
      const session = readSession(saved, Date.now())
      if (session === undefined) {
        tokens.clear()
        return
      }
      patchState(store, { session })
      armExpiry(session.exp, () => store.logOut())
    },
    onDestroy() {
      clearExpiry()
    },
  }),
)

function allow(roles: readonly Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthStore)
    const router = inject(Router)
    auth.dropIfExpired()
    const session = auth.session()
    if (session === null) return router.createUrlTree(['/login'])
    if (roles.includes(session.role)) return true
    const isAdminOnlyRoute = roles.length === 1 && roles[0] === 'admin'
    return isAdminOnlyRoute
      ? router.createUrlTree(['/'], { queryParams: { admin: '1' }, queryParamsHandling: 'merge' })
      : router.createUrlTree(['/'])
  }
}

export const editorGuard: CanActivateFn = allow(['editor', 'admin'])
export const adminGuard: CanActivateFn = allow(['admin'])

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStore)
  const router = inject(Router)
  auth.dropIfExpired()
  return auth.session() === null ? true : router.createUrlTree(['/'])
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStore)
  auth.dropIfExpired()
  const token = auth.session()?.token
  const outgoing =
    token === undefined
      ? request
      : request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !outgoing.url.endsWith(loginPath)
      ) {
        auth.logOut()
      }
      return throwError(() => error)
    }),
  )
}
