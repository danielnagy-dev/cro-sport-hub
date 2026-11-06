import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { expect, vi } from 'vite-plus/test'
import { App } from '../app'
import { appConfig } from '../app.config'
import { editorMatchesPath } from './matches-api'
import {
  adminGuard,
  AuthStore,
  authInterceptor,
  editorGuard,
  guestGuard,
  loginPath,
  readSession,
  TOKEN_STORE,
  type TokenStore,
} from './auth'

@Component({ selector: 'login-probe', template: 'login-page' })
class LoginProbe {}

@Component({ selector: 'home-probe', template: 'home-page' })
class HomeProbe {}

@Component({ selector: 'admin-probe', template: 'admin-page' })
class AdminProbe {}

function bearer(role: 'editor' | 'admin', exp: number, sub = `${role}-demo`): string {
  const payload = btoa(JSON.stringify({ sub, role, exp }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

function memoryStore(): TokenStore {
  let value: string | null = null
  return {
    read: () => value,
    write: (token) => {
      value = token
    },
    clear: () => {
      value = null
    },
  }
}

const hour = 60 * 60

describe('readSession', () => {
  const now = 1_700_000_000_000

  it('reads an editor or admin claim and drops anything else', () => {
    const exp = Math.floor(now / 1000) + hour
    expect(readSession(bearer('editor', exp), now)).toMatchObject({
      id: 'editor-demo',
      role: 'editor',
      exp,
    })
    expect(readSession(bearer('admin', exp, 'admin-demo'), now)?.role).toBe('admin')
    expect(readSession(bearer('editor', Math.floor(now / 1000) - 1), now)).toBeUndefined()
    expect(readSession('not-a-token', now)).toBeUndefined()
    const guest = btoa(JSON.stringify({ sub: 'editor-demo', role: 'guest', exp }))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '')
    expect(readSession(`eyJhbGciOiJIUzI1NiJ9.${guest}.sig`, now)).toBeUndefined()
  })
})

describe('AuthStore', () => {
  let tokens: TokenStore

  beforeEach(() => {
    tokens = memoryStore()
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: tokens },
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    TestBed.inject(AuthStore).logOut()
    TestBed.inject(HttpTestingController).verify()
  })

  it('stores a token from login and sends it as a bearer', async () => {
    const exp = Math.floor(Date.now() / 1000) + hour
    const token = bearer('editor', exp)
    const store = TestBed.inject(AuthStore)
    const http = TestBed.inject(HttpTestingController)
    const pending = store.signIn({ id: 'editor-demo', password: 'secret' })
    const login = http.expectOne(loginPath)
    expect(login.request.body).toEqual({ id: 'editor-demo', password: 'secret' })
    login.flush({ token })
    await expect(pending).resolves.toBe('ok')
    expect(store.session()).toMatchObject({ id: 'editor-demo', role: 'editor', exp })
    expect(tokens.read()).toBe(token)

    TestBed.inject(HttpClient)
      .get('/api/matches')
      .subscribe({ error: () => undefined })
    const matches = http.expectOne('/api/matches')
    expect(matches.request.headers.get('Authorization')).toBe(`Bearer ${token}`)
    matches.flush('nope', { status: 401, statusText: 'Unauthorized' })
    expect(store.session()).toBeNull()
    expect(tokens.read()).toBeNull()
  })

  it('treats 401 and 400 as invalid credentials', async () => {
    const store = TestBed.inject(AuthStore)
    const http = TestBed.inject(HttpTestingController)
    const wrong = store.signIn({ id: 'editor-demo', password: 'nope' })
    http.expectOne(loginPath).flush({}, { status: 401, statusText: 'Unauthorized' })
    await expect(wrong).resolves.toBe('invalid')

    const bad = store.signIn({ id: 'editor-demo', password: 'nope' })
    http.expectOne(loginPath).flush({}, { status: 400, statusText: 'Bad Request' })
    await expect(bad).resolves.toBe('invalid')
    expect(store.session()).toBeNull()
  })

  it('rejects a failed login and an unusable token', async () => {
    const store = TestBed.inject(AuthStore)
    const http = TestBed.inject(HttpTestingController)
    const down = store.signIn({ id: 'editor-demo', password: 'secret' })
    http.expectOne(loginPath).flush({}, { status: 500, statusText: 'Error' })
    await expect(down).resolves.toBe('rejected')

    const bad = store.signIn({ id: 'editor-demo', password: 'secret' })
    http.expectOne(loginPath).flush({ token: 'not-a-jwt' })
    await expect(bad).resolves.toBe('rejected')
    expect(store.session()).toBeNull()
  })

  it('drops the session when the token expires', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const exp = Math.floor(Date.now() / 1000) + 30
    const store = TestBed.inject(AuthStore)
    const http = TestBed.inject(HttpTestingController)
    const pending = store.signIn({ id: 'editor-demo', password: 'secret' })
    http.expectOne(loginPath).flush({ token: bearer('editor', exp) })
    await expect(pending).resolves.toBe('ok')
    vi.advanceTimersByTime(30_000)
    expect(store.session()).toBeNull()
    expect(tokens.read()).toBeNull()
  })

  it('does not restore an expired token', () => {
    tokens.write(bearer('editor', Math.floor(Date.now() / 1000) - 5))
    expect(TestBed.inject(AuthStore).session()).toBeNull()
    expect(tokens.read()).toBeNull()
  })
})

describe('role guards', () => {
  let tokens: TokenStore

  beforeEach(() => {
    tokens = memoryStore()
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: LoginProbe, canActivate: [guestGuard] },
          { path: '', component: HomeProbe, canActivate: [editorGuard] },
          { path: 'admin', component: AdminProbe, canActivate: [adminGuard] },
        ]),
        { provide: TOKEN_STORE, useValue: tokens },
      ],
    })
  })

  it('sends a guest and an expired token to login', async () => {
    const harness = await RouterTestingHarness.create()
    await harness.navigateByUrl('/')
    expect(TestBed.inject(Router).url).toBe('/login')
    await harness.navigateByUrl('/admin')
    expect(TestBed.inject(Router).url).toBe('/login')
  })

  it('sends an expired stored token to login', async () => {
    tokens.write(bearer('editor', Math.floor(Date.now() / 1000) - 5))
    const harness = await RouterTestingHarness.create()
    await harness.navigateByUrl('/')
    expect(TestBed.inject(Router).url).toBe('/login')
  })

  it('lets an editor into the studio and keeps them out of admin', async () => {
    tokens.write(bearer('editor', Math.floor(Date.now() / 1000) + hour))
    const harness = await RouterTestingHarness.create()
    await harness.navigateByUrl('/')
    expect(harness.routeNativeElement?.textContent).toContain('home-page')
    await harness.navigateByUrl('/admin')
    expect(TestBed.inject(Router).url).toBe('/?admin=1')
    await harness.navigateByUrl('/login')
    expect(TestBed.inject(Router).url).toBe('/')
  })

  it('lets an admin into the studio and the admin page', async () => {
    tokens.write(bearer('admin', Math.floor(Date.now() / 1000) + hour))
    const harness = await RouterTestingHarness.create()
    await harness.navigateByUrl('/admin')
    expect(harness.routeNativeElement?.textContent).toContain('admin-page')
    await harness.navigateByUrl('/')
    expect(harness.routeNativeElement?.textContent).toContain('home-page')
  })
})

describe('session redirect', () => {
  it('returns to login when the session ends', async () => {
    const tokens = memoryStore()
    tokens.write(bearer('editor', Math.floor(Date.now() / 1000) + hour))
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: tokens },
      ],
    }).compileComponents()

    const fixture = TestBed.createComponent(App)
    const router = TestBed.inject(Router)
    const http = TestBed.inject(HttpTestingController)
    fixture.detectChanges()
    await router.navigateByUrl('/matches')
    http.expectOne(editorMatchesPath).flush({ items: [], limit: 20, offset: 0, total: 0 })
    fixture.detectChanges()
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement
    expect(router.url).toBe('/matches')
    expect(root.textContent).toContain('editor-demo')

    TestBed.inject(AuthStore).logOut()
    await fixture.whenStable()
    expect(TestBed.inject(Router).url).toBe('/login')
    expect(root.textContent).toContain('Log in')
    http.verify()
  })
})
