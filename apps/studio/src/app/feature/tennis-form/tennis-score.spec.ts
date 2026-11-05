import { Component } from '@angular/core'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { expect } from 'vite-plus/test'
import type { WritableSignal } from '@angular/core'
import type { AthleteLookup, CompetitionLookup } from '@cro-sport-hub/shared-types'
import { authInterceptor, editorGuard, TOKEN_STORE, type TokenStore } from '../../core/auth'
import { editorAthletesPath, editorCompetitionsPath } from '../../core/editor-lookups-api'
import { matchSubmitPath } from '../../core/match-submit-api'
import { tennisDraftsPath, tennisDraftUpdatePath } from '../../core/tennis-api'
import type { TennisFormModel } from './draft-body'
import { TennisScorePage } from './tennis-score'

const competitions: CompetitionLookup[] = [
  { id: 'comp-sample-cup', name: 'Sample Cup', season: '2026' },
]
const athletes: AthleteLookup[] = [
  { id: 'sample-player-a', name: 'Sample Player A' },
  { id: 'sample-player-b', name: 'Sample Player B' },
]

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

function bearer(exp: number): string {
  const payload = btoa(JSON.stringify({ sub: 'editor-demo', role: 'editor', exp }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

function modelSignal(fixture: ComponentFixture<TennisScorePage>): WritableSignal<TennisFormModel> {
  return (fixture.componentInstance as unknown as { model: WritableSignal<TennisFormModel> }).model
}

function clickSave(root: HTMLElement): void {
  ;[...root.querySelectorAll('button')]
    .find((button) => button.textContent?.includes('Save draft'))
    ?.click()
}

function clickSubmitForReview(root: HTMLElement): void {
  ;[...root.querySelectorAll('button')]
    .find((button) => button.textContent?.includes('Submit for review'))
    ?.click()
}

function validStatStrings(overrides: Partial<Record<string, string>> = {}) {
  return {
    aces: '3',
    doubleFaults: '1',
    firstServeIn: '6',
    firstServeTotal: '10',
    firstServePointsWon: '4',
    secondServePointsWon: '2',
    secondServeTotal: '4',
    breakPointsSaved: '1',
    breakPointsFaced: '2',
    breakPointsWon: '2',
    breakPointsTotal: '4',
    totalPointsWon: '20',
    ...overrides,
  }
}

function fillValidScoreModel(model: TennisFormModel): TennisFormModel {
  return {
    ...model,
    competitionId: 'comp-sample-cup',
    date: '2026-10-20',
    round: 'Final',
    playerAId: 'sample-player-a',
    playerBId: 'sample-player-b',
    winnerId: 'sample-player-a',
    sets: model.sets.map((row, index) => {
      if (index === 0) return { gamesA: '6', gamesB: '4', tiebreak: '' }
      if (index === 1) return { gamesA: '6', gamesB: '3', tiebreak: '' }
      return row
    }),
  }
}

function fillValidScore(model: WritableSignal<TennisFormModel>): void {
  model.update((current) => fillValidScoreModel(current))
}

async function boot(): Promise<{
  fixture: ComponentFixture<TennisScorePage>
  http: HttpTestingController
  root: HTMLElement
}> {
  const fixture = TestBed.createComponent(TennisScorePage)
  fixture.detectChanges()
  const http = TestBed.inject(HttpTestingController)
  const root = fixture.nativeElement as HTMLElement
  http.expectOne(`${editorCompetitionsPath}?sport=tennis`).flush(competitions)
  http.expectOne(`${editorAthletesPath}?sport=tennis`).flush(athletes)
  await fixture.whenStable()
  fixture.detectChanges()
  await fixture.whenStable()
  return { fixture, http, root }
}

describe('TennisScorePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TennisScorePage],
      providers: [
        provideRouter([
          {
            path: 'matches/new/tennis',
            component: TennisScorePage,
            canActivate: [editorGuard],
          },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(bearer(Math.floor(Date.now() / 1000) + 3600))
  })

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
    TestBed.resetTestingModule()
  })

  it('shows shared-schema messages and sends no request for an empty submit', async () => {
    const { fixture, http, root } = await boot()
    ;(fixture.componentInstance as unknown as { onSubmit: (event: Event) => void }).onSubmit(
      new Event('submit'),
    )
    fixture.detectChanges()
    await fixture.whenStable()
    expect(root.textContent).toContain('Expected an id of 1–64 letters')
    http.expectNone(tennisDraftsPath)
  })

  it('posts a valid best-of-3 final without stats, status, or retired', async () => {
    const { fixture, http, root } = await boot()
    fillValidScore(modelSignal(fixture))
    fixture.detectChanges()
    clickSave(root)
    await fixture.whenStable()
    const request = http.expectOne(tennisDraftsPath)
    const body = request.request.body as Record<string, unknown>
    expect(body['status']).toBeUndefined()
    expect(body['stats']).toBeUndefined()
    expect(body['retired']).toBeUndefined()
    expect(body['bestOf']).toBe(3)
    expect(body['score']).toEqual([
      [6, 4],
      [6, 3],
    ])
    request.flush({ id: 'match-new-draft', status: 'draft', sport: 'tennis' })
    await fixture.whenStable()
    fixture.detectChanges()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(root.textContent).toContain('match-new-draft')
    http.expectNone(tennisDraftsPath)
  })

  it('shows 60% for first serve and No attempts when the denominator is zero', async () => {
    const { fixture, root } = await boot()
    modelSignal(fixture).update((model) => ({
      ...model,
      playerAStats: validStatStrings({
        firstServeIn: '6',
        firstServeTotal: '10',
        secondServeTotal: '4',
        firstServePointsWon: '4',
      }),
      playerBStats: validStatStrings({
        firstServeIn: '0',
        firstServeTotal: '0',
        firstServePointsWon: '0',
        secondServeTotal: '0',
        secondServePointsWon: '0',
      }),
    }))
    fixture.detectChanges()
    expect(root.textContent).toContain('60%')
    expect(root.textContent).toContain('No attempts')
  })

  it('submits for review only after a draft id exists', async () => {
    const { fixture, http, root } = await boot()
    fillValidScore(modelSignal(fixture))
    fixture.detectChanges()
    ;(fixture.componentInstance as unknown as { onSubmitForReview: () => void }).onSubmitForReview()
    await fixture.whenStable()
    http.expectNone((url) => url.url.includes('/submit'))

    clickSave(root)
    await fixture.whenStable()
    http
      .expectOne(tennisDraftsPath)
      .flush({ id: 'match-submit-me', status: 'draft', sport: 'tennis' })
    await fixture.whenStable()
    fixture.detectChanges()

    clickSubmitForReview(root)
    await fixture.whenStable()
    const submit = http.expectOne(matchSubmitPath('match-submit-me'))
    expect(submit.request.method).toBe('POST')
    submit.flush({ id: 'match-submit-me', status: 'review' })
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain('Status: review')
    expect(root.textContent).not.toContain('Submit for review')
  })

  it('shows the tiebreak message for 7-6 without tiebreak points and sends nothing', async () => {
    const { fixture, http, root } = await boot()
    modelSignal(fixture).update((model) => ({
      ...model,
      competitionId: 'comp-sample-cup',
      date: '2026-10-20',
      round: 'Final',
      playerAId: 'sample-player-a',
      playerBId: 'sample-player-b',
      winnerId: 'sample-player-a',
      sets: model.sets.map((row, index) => {
        if (index === 0) return { gamesA: '7', gamesB: '6', tiebreak: '' }
        if (index === 1) return { gamesA: '6', gamesB: '3', tiebreak: '' }
        return row
      }),
    }))
    fixture.detectChanges()
    clickSave(root)
    await fixture.whenStable()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(root.textContent).toContain(
      'A 7-6 set needs the tiebreak points scored by the player who lost the set',
    )
    http.expectNone(tennisDraftsPath)
  })
})

describe('TennisScorePage edit', () => {
  async function bootEdit(id: string): Promise<{
    harness: RouterTestingHarness
    http: HttpTestingController
    root: HTMLElement
    draftRequest: ReturnType<HttpTestingController['expectOne']>
  }> {
    await TestBed.configureTestingModule({
      imports: [TennisScorePage],
      providers: [
        provideRouter([{ path: 'matches/:id/tennis', component: TennisScorePage }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(bearer(Math.floor(Date.now() / 1000) + 3600))
    const harness = await RouterTestingHarness.create()
    await harness.navigateByUrl(`/matches/${id}/tennis`)
    await harness.fixture.whenStable()
    const http = TestBed.inject(HttpTestingController)
    const root = harness.routeNativeElement as HTMLElement
    http.expectOne(`${editorCompetitionsPath}?sport=tennis`).flush(competitions)
    http.expectOne(`${editorAthletesPath}?sport=tennis`).flush(athletes)
    await harness.fixture.whenStable()
    const draftRequest = http.expectOne((req) =>
      req.url.includes(`/api/editor/matches/tennis/${id}`),
    )
    return { harness, http, root, draftRequest }
  }

  it('loads the draft, fills the form, and saves with PUT without status', async () => {
    const { harness, http, root, draftRequest } = await bootEdit('match-sample-qf')
    draftRequest.flush({
      id: 'match-sample-qf',
      competitionId: 'comp-sample-cup',
      date: '2026-10-16',
      round: 'QF',
      playerAId: 'sample-player-c',
      playerBId: 'sample-player-d',
      winnerId: 'sample-player-c',
      bestOf: 3,
      score: [
        [6, 3],
        [4, 2],
      ],
      retired: true,
      status: 'draft',
    })
    await harness.fixture.whenStable()
    harness.detectChanges()
    expect(root.textContent).toContain('Edit tennis match')
    const round = root.querySelector('#round')
    expect(round instanceof HTMLInputElement ? round.value : '').toBe('QF')
    clickSave(root)
    await harness.fixture.whenStable()
    const request = http.expectOne(tennisDraftUpdatePath('match-sample-qf'))
    const body = request.request.body as Record<string, unknown>
    expect(body['status']).toBeUndefined()
    expect(body['firstServePct']).toBeUndefined()
    request.flush({ id: 'match-sample-qf', status: 'draft', sport: 'tennis' })
    await harness.fixture.whenStable()
    http.verify()
    TestBed.resetTestingModule()
  })

  it('shows Match not found for an unknown id', async () => {
    const { harness, http, root, draftRequest } = await bootEdit('match-missing')
    draftRequest.flush(null, { status: 404, statusText: 'Not Found' })
    await harness.fixture.whenStable()
    harness.detectChanges()
    expect(root.textContent).toContain('Match not found')
    http.verify()
    TestBed.resetTestingModule()
  })
})

describe('TennisScorePage guest', () => {
  @Component({ template: '' })
  class LoginProbe {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TennisScorePage, LoginProbe],
      providers: [
        provideRouter([
          { path: 'login', component: LoginProbe },
          {
            path: 'matches/new/tennis',
            component: TennisScorePage,
            canActivate: [editorGuard],
          },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
  })

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
    TestBed.resetTestingModule()
  })

  it('sends a guest to login', async () => {
    await TestBed.inject(Router).navigateByUrl('/matches/new/tennis')
    expect(TestBed.inject(Router).url).toBe('/login')
  })
})
