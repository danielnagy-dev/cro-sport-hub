import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { expect } from 'vite-plus/test'
import { appearancesPath } from '../../core/appearances-api'
import { authInterceptor, editorGuard, TOKEN_STORE, type TokenStore } from '../../core/auth'
import { editorTrackedAthletesPath, type EditorAthlete } from '../../core/editor-athletes-api'
import { publishSlotsPath, samplePublishSlot } from '../../core/publish-slots-api'
import { sourcesPath } from '../../core/sources-api'
import { SportasiPage } from './sportasi'
import { SportasiProfilePage } from './sportasi-profile'

const ace: EditorAthlete = {
  id: 'sample-player-a',
  slug: 'sample-player-a',
  name: 'Sample Player A',
  sportId: 'sport-tennis',
  country: 'HR',
}
const past = {
  id: 'appearance-sample-tennis',
  sportSlug: 'tennis',
  opponentLabel: 'Sample Rival',
  startsAt: '2020-01-01T12:00:00.000Z',
  creatorKind: 'manual',
}
const future = {
  id: 'appearance-future-tennis',
  sportSlug: 'tennis',
  opponentLabel: 'Sample Next',
  startsAt: '2099-01-01T12:00:00.000Z',
  creatorKind: 'manual',
}

describe('SportasiProfilePage', () => {
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
      imports: [SportasiProfilePage, SportasiPage],
      providers: [
        provideRouter([
          { path: 'sportasi/:id', component: SportasiProfilePage, canActivate: [editorGuard] },
          { path: 'sportasi', component: SportasiPage, canActivate: [editorGuard] },
        ]),
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

  it('loads profile sections and links from the list', async () => {
    const harness = await RouterTestingHarness.create()
    await harness.navigateByUrl('/sportasi?sport=tennis', SportasiPage)
    http.expectOne(`${editorTrackedAthletesPath}?sport=tennis`).flush([ace])
    await harness.fixture.whenStable()
    harness.fixture.detectChanges()
    const listRoot = harness.fixture.nativeElement as HTMLElement
    expect(
      listRoot.querySelector(`a[href="/sportasi/${ace.id}?sport=tennis"]`)?.textContent?.trim(),
    ).toBe(ace.name)

    await harness.navigateByUrl(`/sportasi/${ace.id}?sport=tennis`, SportasiProfilePage)
    http.expectOne(`${editorTrackedAthletesPath}?sport=tennis`).flush([ace])
    http.expectOne(`${appearancesPath}?athleteId=${ace.id}`).flush([past, future])
    http.expectOne(`${sourcesPath}?appearanceId=${past.id}`).flush([])
    http.expectOne(`${sourcesPath}?appearanceId=${future.id}`).flush([])
    http.expectOne(`${publishSlotsPath}?day=2020-01-01`).flush([])
    http
      .expectOne(`${publishSlotsPath}?day=2099-01-01`)
      .flush([{ ...samplePublishSlot, slotDate: '2099-01-01', slideOrder: [future.id] }])
    await harness.fixture.whenStable()
    harness.fixture.detectChanges()
    const root = harness.fixture.nativeElement as HTMLElement
    expect(root.querySelector('h2')?.textContent?.trim()).toBe(ace.name)
    expect(root.textContent).toContain('Sample Next')
    expect(root.textContent).toContain('Sample Rival')
    expect(root.textContent).toContain('instagram')
    expect(root.textContent).toContain('Nema izvora za nastupe ovog sportaša.')
  })

  it('shows missing when the athlete id is unknown', async () => {
    const harness = await RouterTestingHarness.create()
    await harness.navigateByUrl('/sportasi/missing-athlete?sport=tennis', SportasiProfilePage)
    http.expectOne(`${editorTrackedAthletesPath}?sport=tennis`).flush([ace])
    await harness.fixture.whenStable()
    harness.fixture.detectChanges()
    expect((harness.fixture.nativeElement as HTMLElement).textContent).toContain(
      'Sportaš nije pronađen.',
    )
  })
})
