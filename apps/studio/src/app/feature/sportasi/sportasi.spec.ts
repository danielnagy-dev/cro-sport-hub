import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { expect } from 'vite-plus/test'
import { authInterceptor, editorGuard, TOKEN_STORE, type TokenStore } from '../../core/auth'
import {
  editorTrackedAthletePath,
  editorTrackedAthletesPath,
  type EditorAthlete,
} from '../../core/editor-athletes-api'
import { t } from '../../core/messages'
import { SportasiPage } from './sportasi'

const racket: EditorAthlete = {
  id: 'sample-racket',
  slug: 'sample-racket',
  name: 'Sample Racket',
  sportId: 'sport-tennis',
  country: 'HR',
}
const ace: EditorAthlete = {
  id: 'sample-player-a',
  slug: 'sample-player-a',
  name: 'Sample Player A',
  sportId: 'sport-tennis',
  country: 'HR',
}

function listUrl(sport: string): string {
  return `${editorTrackedAthletesPath}?sport=${sport}`
}

describe('SportasiPage', () => {
  let http: HttpTestingController

  beforeEach(async () => {
    let token: string | null = null
    const store: TokenStore = {
      read: () => token,
      write: (v) => {
        token = v
      },
      clear: () => {
        token = null
      },
    }
    await TestBed.configureTestingModule({
      imports: [SportasiPage],
      providers: [
        provideRouter([{ path: 'sportasi', component: SportasiPage, canActivate: [editorGuard] }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: store },
      ],
    }).compileComponents()
    const exp = Math.floor(Date.now() / 1000) + 3600
    const payload = btoa(JSON.stringify({ sub: 'editor-demo', role: 'editor', exp }))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '')
    store.write(`eyJhbGciOiJIUzI1NiJ9.${payload}.sig`)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    http.verify()
    TestBed.resetTestingModule()
  })

  it('filters by sport, creates, and updates via the editor API', async () => {
    const harness = await RouterTestingHarness.create()
    const page = await harness.navigateByUrl('/sportasi', SportasiPage)
    const root = harness.fixture.nativeElement as HTMLElement
    const model = page as unknown as {
      model: { set(v: unknown): void }
      loadForm(row?: EditorAthlete): void
    }
    http.expectOne(listUrl('tennis')).flush([ace])
    await harness.fixture.whenStable()
    harness.fixture.detectChanges()

    const select = root.querySelector('#filter-sport')
    if (!(select instanceof HTMLSelectElement)) throw new Error('missing sport filter')
    select.value = 'football'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    await harness.fixture.whenStable()
    expect(TestBed.inject(Router).url).toContain('sport=football')
    http.expectOne(listUrl('football')).flush([])
    await harness.fixture.whenStable()
    harness.fixture.detectChanges()
    expect(root.textContent).toContain(t('sportasi.lead'))

    select.value = 'tennis'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    await harness.fixture.whenStable()
    http.expectOne(listUrl('tennis')).flush([ace])
    await harness.fixture.whenStable()

    model.model.set({ ...racket, sport: 'tennis' })
    harness.fixture.detectChanges()
    ;[...root.querySelectorAll('button')].find((n) => n.textContent?.includes('Spremi'))?.click()
    const create = http.expectOne(editorTrackedAthletesPath)
    expect(create.request.method).toBe('POST')
    expect(create.request.body).toEqual(racket)
    create.flush(racket)
    http.expectOne(listUrl('tennis')).flush([ace, racket])
    await harness.fixture.whenStable()

    model.loadForm(racket)
    model.model.set({ ...racket, name: 'Sample Racket II', sport: 'tennis' })
    harness.fixture.detectChanges()
    ;[...root.querySelectorAll('button')].find((n) => n.textContent?.includes('Spremi'))?.click()
    const update = http.expectOne(editorTrackedAthletePath(racket.id))
    expect(update.request.method).toBe('PUT')
    expect(update.request.body).toMatchObject({ name: 'Sample Racket II' })
    update.flush({ ...racket, name: 'Sample Racket II' })
    http.expectOne(listUrl('tennis')).flush([{ ...racket, name: 'Sample Racket II' }])
    await harness.fixture.whenStable()
    harness.fixture.detectChanges()
    expect(root.textContent).toContain('Sample Racket II')
  })
})
