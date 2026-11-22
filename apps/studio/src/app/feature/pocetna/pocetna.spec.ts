import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router'
import { of } from 'rxjs'
import { expect } from 'vite-plus/test'
import { appearancesPath, type EditorAppearance } from '../../core/appearances-api'
import { authInterceptor, TOKEN_STORE, type TokenStore } from '../../core/auth'
import {
  publishSlotsNextPath,
  publishSlotsPath,
  samplePublishSlot,
  type PublishSlot,
} from '../../core/publish-slots-api'
import { sampleSlidePreviews, slidePreviewsPath } from '../../core/slide-preview-api'
import { shiftEditorialDay, startOfLocalDay } from '../editorial-day'
import { editorialDayIso, PocetnaPage } from './pocetna'

const HOUR = 60 * 60

function bearer(): string {
  const payload = btoa(
    JSON.stringify({
      sub: 'editor-demo',
      role: 'editor',
      exp: Math.floor(Date.now() / 1000) + HOUR,
    }),
  )
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

const plannedSlot: PublishSlot = {
  ...samplePublishSlot,
  status: 'planned',
  networkPosts: samplePublishSlot.networkPosts.map((post) => ({ ...post, status: 'planned' })),
}

const athleteRow: EditorAppearance = {
  id: 'appearance-sample-tennis',
  sportSlug: 'tennis',
  opponentLabel: 'Sample Rival',
  startsAt: '2026-11-22T14:00:00.000Z',
  creatorKind: 'manual',
}

const teamRow: EditorAppearance = {
  id: 'appearance-sample-football-nt',
  sportSlug: 'football',
  opponentLabel: 'Sample Neighbours',
  startsAt: '2026-11-22T19:45:00.000Z',
  creatorKind: 'manual',
}

function flushDashboard(http: HttpTestingController, day: string): void {
  http.expectOne(publishSlotsNextPath).flush(plannedSlot)
  http.expectOne(`${publishSlotsPath}?day=${day}`).flush([plannedSlot])
  http.expectOne(`${appearancesPath}?day=${day}&sportSlug=tennis`).flush([athleteRow, teamRow])
}

describe('PocetnaPage dashboard', () => {
  let http: HttpTestingController

  beforeEach(async () => {
    TestBed.resetTestingModule()
    sessionStorage.clear()
    await TestBed.configureTestingModule({
      imports: [PocetnaPage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore(bearer()) },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    }).compileComponents()
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('reloads lists when the FilterBar day changes', async () => {
    const fixture = TestBed.createComponent(PocetnaPage)
    fixture.detectChanges()
    const today = editorialDayIso(startOfLocalDay())
    flushDashboard(http, today)
    await fixture.whenStable()
    fixture.detectChanges()

    const root = fixture.nativeElement as HTMLElement
    expect(root.querySelector('csh-ui-filter-bar')).not.toBeNull()
    expect(root.textContent).toContain('Sljedeći termin')
    expect(root.textContent).toContain('Sample Rival')
    expect(root.textContent).toContain('Sample Neighbours')

    const previous = root.querySelector('button[aria-label="Previous day"]')
    if (!(previous instanceof HTMLButtonElement)) throw new Error('missing previous day')
    previous.click()
    fixture.detectChanges()
    flushDashboard(http, editorialDayIso(shiftEditorialDay(startOfLocalDay(), -1)))
    await fixture.whenStable()
  })

  it('opens the shared drawer from a post without navigating', async () => {
    const fixture = TestBed.createComponent(PocetnaPage)
    const router = TestBed.inject(Router)
    fixture.detectChanges()
    flushDashboard(http, editorialDayIso(startOfLocalDay()))
    await fixture.whenStable()
    fixture.detectChanges()
    const before = router.url
    const root = fixture.nativeElement as HTMLElement
    const postButton = [...root.querySelectorAll('button')].find((button) =>
      (button.textContent ?? '').includes('15:30'),
    )
    if (!(postButton instanceof HTMLButtonElement)) throw new Error('missing post row')
    postButton.click()
    fixture.detectChanges()
    await fixture.whenStable()
    http.expectOne(slidePreviewsPath(samplePublishSlot.id)).flush(sampleSlidePreviews)
    await fixture.whenStable()
    fixture.detectChanges()
    expect(router.url).toBe(before)
    expect(root.querySelector('csh-ui-drawer')).not.toBeNull()
    expect(root.textContent).toContain('Objava')
  })
})
