import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import { App } from './app'
import { appConfig } from './app.config'
import { TOKEN_STORE, type TokenStore } from './core/auth'
import { editorMatchesPath } from './core/matches-api'

const editorPaths = [
  '/',
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
  for (const request of http.match(() => true)) request.flush([])
}

async function boot(
  token: string | null,
): Promise<{ router: Router; http: HttpTestingController; fixture: ComponentFixture<App> }> {
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
  return { router, http, fixture }
}

describe('studioRoutes', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
  })

  it('keeps each editor path on that feature', async () => {
    const { router, http, fixture } = await boot(editorToken())
    for (const path of editorPaths) {
      await router.navigateByUrl(path)
      settle(http)
      fixture.detectChanges()
      await fixture.whenStable()
      expect(router.url).toBe(path)
    }
  })

  it('renders the home shell at / for a signed-in editor', async () => {
    const { router, http, fixture } = await boot(editorToken())
    await router.navigateByUrl('/')
    settle(http)
    fixture.detectChanges()
    await fixture.whenStable()
    expect(router.url).toBe('/')
    const root = fixture.nativeElement as HTMLElement
    expect(root.textContent).toContain('Home')
    expect(root.querySelector('h2')?.textContent?.trim()).toBe('Home')
  })

  it('opens login for a guest', async () => {
    const guest = await boot(null)
    await guest.router.navigateByUrl('/login')
    settle(guest.http)
    expect(guest.router.url).toBe('/login')
    await guest.router.navigateByUrl('/admin/competitions')
    settle(guest.http)
    expect(guest.router.url).toBe('/login')
  })

  it('sends an unknown path home for an editor', async () => {
    const { router, http, fixture } = await boot(editorToken())
    await router.navigateByUrl('/missing')
    settle(http)
    fixture.detectChanges()
    await fixture.whenStable()
    expect(router.url).toBe('/')
    await router.navigateByUrl('/matches')
    http.expectOne(editorMatchesPath).flush({ items: [], limit: 20, offset: 0, total: 0 })
    fixture.detectChanges()
    await fixture.whenStable()
    expect(document.querySelector('a[href="/admin/competitions"]')).toBeNull()
    await router.navigateByUrl('/admin/competitions')
    settle(http)
    fixture.detectChanges()
    await fixture.whenStable()
    expect(router.url).toBe('/?admin=1')
  })
})
