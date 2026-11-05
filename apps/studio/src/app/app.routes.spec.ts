import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import { App } from './app'
import { appConfig } from './app.config'
import { TOKEN_STORE, type TokenStore } from './core/auth'

const editorPaths = [
  '/',
  '/matches',
  '/matches/new/tennis',
  '/matches/new/football',
  '/matches/match-sample/football',
  '/matches/match-sample/tennis',
  '/galleries/new',
  '/galleries/gallery-demo',
]

function editorToken(): string {
  const exp = Math.floor(Date.now() / 1000) + 3600
  const payload = btoa(JSON.stringify({ sub: 'editor-demo', role: 'editor', exp }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

function memoryStore(token: string | null): TokenStore {
  let value = token
  return {
    read: () => value,
    write: (next) => {
      value = next
    },
    clear: () => {
      value = null
    },
  }
}

function settle(http: HttpTestingController): void {
  for (const request of http.match(() => true)) request.flush([])
}

async function boot(
  token: string | null,
): Promise<{ router: Router; http: HttpTestingController }> {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      ...appConfig.providers,
      provideHttpClientTesting(),
      { provide: TOKEN_STORE, useValue: memoryStore(token) },
    ],
  }).compileComponents()
  const fixture = TestBed.createComponent(App)
  const router = TestBed.inject(Router)
  const http = TestBed.inject(HttpTestingController)
  fixture.detectChanges()
  return { router, http }
}

describe('studioRoutes', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
  })

  it('keeps each editor path on that feature', async () => {
    const { router, http } = await boot(editorToken())
    for (const path of editorPaths) {
      await router.navigateByUrl(path)
      settle(http)
      expect(router.url).toBe(path)
    }
  })

  it('opens login for a guest', async () => {
    const guest = await boot(null)
    await guest.router.navigateByUrl('/login')
    settle(guest.http)
    expect(guest.router.url).toBe('/login')
  })

  it('sends an unknown path home for an editor', async () => {
    const { router, http } = await boot(editorToken())
    await router.navigateByUrl('/missing')
    settle(http)
    expect(router.url).toBe('/')
  })
})
