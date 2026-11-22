import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import { App } from './app'
import { appConfig } from './app.config'
import { TOKEN_STORE, type TokenStore } from './core/auth'
import { editorMatchesPath } from './core/matches-api'

const editorPaths = [
  '/pocetna',
  '/sportasi',
  '/objave',
  '/postavke',
  '/matches',
  '/matches/new/tennis',
  '/matches/new/football',
  '/matches/match-sample/football',
  '/matches/match-sample/tennis',
  '/matches/match-sample-qf/review',
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
  for (const request of http.match(() => true)) {
    if (request.cancelled) continue
    const url = request.request.urlWithParams
    if (url.includes('/publish-slots/next')) {
      request.flush('No upcoming publish slot', { status: 404, statusText: 'Not Found' })
      continue
    }
    request.flush([])
  }
}

async function boot(
  token: string | null,
): Promise<{ router: Router; http: HttpTestingController; fixture: ComponentFixture<App> }> {
  TestBed.resetTestingModule()
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
  settle(http)
  await fixture.whenStable()
  return { router, http, fixture }
}

async function navigateAndSettle(
  router: Router,
  http: HttpTestingController,
  fixture: ComponentFixture<App>,
  path: string,
): Promise<void> {
  await router.navigateByUrl(path)
  fixture.detectChanges()
  await fixture.whenStable()
  settle(http)
  fixture.detectChanges()
  await fixture.whenStable()
  settle(http)
}

describe('studioRoutes', () => {
  afterEach(() => {
    const http = TestBed.inject(HttpTestingController)
    settle(http)
    http.verify()
  })

  it('keeps each editor path on that feature', async () => {
    const { router, http, fixture } = await boot(editorToken())
    for (const path of editorPaths) {
      await navigateAndSettle(router, http, fixture, path)
      expect(router.url).toBe(path)
    }
  })

  it('opens the four editorial stubs for a signed-in editor', async () => {
    const { router, http, fixture } = await boot(editorToken())
    for (const [path, heading] of [
      ['/pocetna', 'Početna'],
      ['/sportasi', 'Sportaši'],
      ['/objave', 'Objave'],
      ['/postavke', 'Postavke'],
    ] as const) {
      await navigateAndSettle(router, http, fixture, path)
      expect(router.url).toBe(path)
      const root = fixture.nativeElement as HTMLElement
      expect(root.querySelector('h2')?.textContent?.trim()).toBe(heading)
    }
  })

  it('redirects / to Početna for a signed-in editor', async () => {
    const { router, http, fixture } = await boot(editorToken())
    await navigateAndSettle(router, http, fixture, '/')
    expect(router.url).toBe('/pocetna')
    const root = fixture.nativeElement as HTMLElement
    expect(root.querySelector('h2')?.textContent?.trim()).toBe('Početna')
  })

  it('opens login for a guest', async () => {
    const guest = await boot(null)
    await navigateAndSettle(guest.router, guest.http, guest.fixture, '/login')
    expect(guest.router.url).toBe('/login')
    await navigateAndSettle(guest.router, guest.http, guest.fixture, '/sportasi')
    expect(guest.router.url).toBe('/login')
    await navigateAndSettle(guest.router, guest.http, guest.fixture, '/admin/competitions')
    expect(guest.router.url).toBe('/login')
  })

  it('sends an unknown path home for an editor', async () => {
    const { router, http, fixture } = await boot(editorToken())
    await navigateAndSettle(router, http, fixture, '/missing')
    expect(router.url).toBe('/pocetna')
    await router.navigateByUrl('/matches')
    fixture.detectChanges()
    await fixture.whenStable()
    http.expectOne(editorMatchesPath).flush({ items: [], limit: 20, offset: 0, total: 0 })
    fixture.detectChanges()
    await fixture.whenStable()
    settle(http)
    expect(document.querySelector('nav.shell-nav a[href="/admin/competitions"]')).toBeNull()
    await navigateAndSettle(router, http, fixture, '/admin/competitions')
    expect(router.url).toBe('/pocetna?admin=1')
  })
})
