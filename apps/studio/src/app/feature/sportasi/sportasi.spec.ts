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

const ace: EditorAthlete = {
  id: 'sample-player-a',
  slug: 'sample-player-a',
  name: 'Sample Player A',
  sportId: 'sport-tennis',
  country: 'HR',
}
const draft: EditorAthlete = {
  id: 'sample-racket',
  slug: 'sample-racket',
  name: 'Sample Racket',
  sportId: 'sport-tennis',
  country: 'HR',
}
const listUrl = (sport: string) => `${editorTrackedAthletesPath}?sport=${sport}`

describe('SportasiPage', () => {
  let http: HttpTestingController
  let store: TokenStore

  beforeEach(async () => {
    let token: string | null = null
    store = {
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
    const page = await harness.navigateByUrl('/sportasi?sport=football', SportasiPage)
    const root = harness.fixture.nativeElement as HTMLElement
    const api = page as unknown as {
      model: { set(v: unknown): void }
      loadForm(row?: EditorAthlete): void
    }
    http.expectOne(listUrl('football')).flush([])
    await harness.fixture.whenStable()
    harness.fixture.detectChanges()
    expect(root.textContent).toContain(t('sportasi.lead'))
    expect(TestBed.inject(Router).url).toContain('sport=football')

    void harness.navigateByUrl('/sportasi?sport=tennis', SportasiPage)
    await harness.fixture.whenStable()
    http.expectOne(listUrl('tennis')).flush([ace])
    await harness.fixture.whenStable()

    api.model.set({ ...draft, sport: 'tennis' })
    harness.fixture.detectChanges()
    ;[...root.querySelectorAll('button')].find((n) => n.textContent?.includes('Spremi'))?.click()
    const create = http.expectOne(editorTrackedAthletesPath)
    expect(create.request.method).toBe('POST')
    create.flush(draft)
    http.expectOne(listUrl('tennis')).flush([ace, draft])
    await harness.fixture.whenStable()

    api.loadForm(draft)
    api.model.set({ ...draft, name: 'Sample Racket II', sport: 'tennis' })
    harness.fixture.detectChanges()
    ;[...root.querySelectorAll('button')].find((n) => n.textContent?.includes('Spremi'))?.click()
    const update = http.expectOne(editorTrackedAthletePath(draft.id))
    expect(update.request.method).toBe('PUT')
    update.flush({ ...draft, name: 'Sample Racket II' })
    http.expectOne(listUrl('tennis')).flush([{ ...draft, name: 'Sample Racket II' }])
    await harness.fixture.whenStable()
    expect(root.textContent).toContain('Sample Racket II')
  })
})
