import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { expect } from 'vite-plus/test'
import { authInterceptor, editorGuard, TOKEN_STORE, type TokenStore } from '../../core/auth'
import {
  editorAthletesPath,
  editorCompetitionsPath,
  editorTeamsPath,
  matchSubmitPath,
} from '../../core/studio-api'
import { footballDraftsPath, footballDraftUpdatePath } from '../../core/football-api'
import type { AppearanceRowModel, FootballFormModel } from './draft-body'
import { FootballScorePage } from './football-score'

const valid: FootballFormModel = {
  competitionId: 'comp-sample-league',
  date: '2026-10-20',
  round: 'Matchday 11',
  homeTeamId: 'club-sample-home',
  awayTeamId: 'club-sample-away',
  homeGoals: '1',
  awayGoals: '0',
  appearances: [],
}

function appearance(overrides: Partial<AppearanceRowModel> = {}): AppearanceRowModel {
  return {
    athleteId: 'athlete-karlo',
    teamId: 'club-sample-home',
    started: true,
    minutes: '90',
    goals: '2',
    assists: '1',
    yellowCards: '0',
    redCard: false,
    ...overrides,
  }
}

function tokenStore(): TokenStore {
  let value: string | null = null
  return {
    read: () => value,
    write: (t) => {
      value = t
    },
    clear: () => {
      value = null
    },
  }
}

function editorBearer(): string {
  const payload = btoa(
    JSON.stringify({
      sub: 'editor-demo',
      role: 'editor',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  )
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

function modelSignal(fixture: { componentInstance: unknown }) {
  return (fixture.componentInstance as { model: { set: (v: FootballFormModel) => void } }).model
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

async function boot(http: HttpTestingController) {
  const fixture = TestBed.createComponent(FootballScorePage)
  fixture.detectChanges()
  http
    .expectOne(`${editorCompetitionsPath}?sport=football`)
    .flush([{ id: 'comp-sample-league', name: 'Sample League', season: '2026' }])
  http.expectOne(editorTeamsPath).flush([
    { id: 'club-sample-home', name: 'Sample Home' },
    { id: 'club-sample-away', name: 'Sample Away' },
  ])
  http
    .expectOne(`${editorAthletesPath}?sport=football`)
    .flush([{ id: 'athlete-karlo', name: 'Karlo Brkic' }])
  await fixture.whenStable()
  fixture.detectChanges()
  await fixture.whenStable()
  return fixture
}

describe('FootballScorePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FootballScorePage],
      providers: [
        provideRouter([
          { path: 'login', component: class {} },
          {
            path: 'matches/new/football',
            component: FootballScorePage,
            canActivate: [editorGuard],
          },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: tokenStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(editorBearer())
  })

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
    TestBed.resetTestingModule()
  })

  it('sends a guest to login', async () => {
    TestBed.inject(TOKEN_STORE).clear()
    await TestBed.inject(Router).navigateByUrl('/matches/new/football')
    expect(TestBed.inject(Router).url).toBe('/login')
  })

  it('validates and posts a score without appearances or status', async () => {
    const http = TestBed.inject(HttpTestingController)
    const fixture = await boot(http)
    const root = fixture.nativeElement as HTMLElement
    const model = modelSignal(fixture)
    const submit = () =>
      (fixture.componentInstance as unknown as { onSubmit: (e: Event) => void }).onSubmit(
        new Event('submit'),
      )

    submit()
    fixture.detectChanges()
    expect(root.textContent).toContain('Expected an id of 1–64 letters')
    http.expectNone(footballDraftsPath)

    model.set({ ...valid, awayTeamId: 'club-sample-home' })
    fixture.detectChanges()
    submit()
    await fixture.whenStable()
    expect(root.textContent).toContain('Home and away clubs must be different')

    model.set(valid)
    fixture.detectChanges()
    submit()
    await fixture.whenStable()
    const req = http.expectOne(footballDraftsPath)
    expect(req.request.body).toMatchObject({ homeGoals: 1, awayGoals: 0 })
    expect(req.request.body).not.toHaveProperty('appearances')
    req.flush({ id: 'match-new-draft', status: 'draft', sport: 'football' })
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain('match-new-draft')
  })

  it('posts one appearance with raw counts and no derived field', async () => {
    const http = TestBed.inject(HttpTestingController)
    const fixture = await boot(http)
    modelSignal(fixture).set({ ...valid, appearances: [appearance()] })
    fixture.detectChanges()
    clickSave(fixture.nativeElement as HTMLElement)
    await fixture.whenStable()
    const req = http.expectOne(footballDraftsPath)
    expect(req.request.body).toMatchObject({
      appearances: [
        {
          athleteId: 'athlete-karlo',
          teamId: 'club-sample-home',
          started: true,
          minutes: 90,
          goals: 2,
          assists: 1,
          yellowCards: 0,
          redCard: false,
        },
      ],
    })
    req.flush({ id: 'match-with-apps', status: 'draft', sport: 'football' })
    await fixture.whenStable()
  })

  it('shows a zero-minute goal error and sends nothing', async () => {
    const http = TestBed.inject(HttpTestingController)
    const fixture = await boot(http)
    const root = fixture.nativeElement as HTMLElement
    modelSignal(fixture).set({
      ...valid,
      appearances: [appearance({ minutes: '0', goals: '1', started: false })],
    })
    fixture.detectChanges()
    clickSave(root)
    await fixture.whenStable()
    expect(root.textContent).toContain('A player with no minutes cannot have goals')
    http.expectNone(footballDraftsPath)
  })

  it('submits for review only after a draft id exists', async () => {
    const http = TestBed.inject(HttpTestingController)
    const fixture = await boot(http)
    const root = fixture.nativeElement as HTMLElement
    modelSignal(fixture).set(valid)
    fixture.detectChanges()
    ;(fixture.componentInstance as unknown as { onSubmitForReview: () => void }).onSubmitForReview()
    await fixture.whenStable()
    http.expectNone((url) => url.url.includes('/submit'))

    clickSave(root)
    await fixture.whenStable()
    http
      .expectOne(footballDraftsPath)
      .flush({ id: 'match-submit-me', status: 'draft', sport: 'football' })
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
})

describe('FootballScorePage edit', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
    TestBed.resetTestingModule()
  })

  async function bootEdit(id: string): Promise<{
    harness: RouterTestingHarness
    http: HttpTestingController
    root: HTMLElement
    draftRequest: ReturnType<HttpTestingController['expectOne']>
  }> {
    await TestBed.configureTestingModule({
      imports: [FootballScorePage],
      providers: [
        provideRouter([{ path: 'matches/:id/football', component: FootballScorePage }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: tokenStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(editorBearer())
    const harness = await RouterTestingHarness.create()
    await harness.navigateByUrl(`/matches/${id}/football`)
    await harness.fixture.whenStable()
    const http = TestBed.inject(HttpTestingController)
    const root = harness.routeNativeElement as HTMLElement
    http
      .expectOne(`${editorCompetitionsPath}?sport=football`)
      .flush([{ id: 'comp-sample-league', name: 'Sample League', season: '2026' }])
    http.expectOne(editorTeamsPath).flush([
      { id: 'club-sample-home', name: 'Sample Home' },
      { id: 'club-sample-away', name: 'Sample Away' },
    ])
    http
      .expectOne(`${editorAthletesPath}?sport=football`)
      .flush([{ id: 'athlete-karlo', name: 'Karlo Brkic' }])
    await harness.fixture.whenStable()
    const draftRequest = http.expectOne((req) =>
      req.url.includes(`/api/editor/matches/football/${id}`),
    )
    return { harness, http, root, draftRequest }
  }

  it('loads the draft, fills the form, and saves with PUT without status', async () => {
    const { harness, http, root, draftRequest } = await bootEdit('match-sample-league')
    draftRequest.flush({
      id: 'match-sample-league',
      competitionId: 'comp-sample-league',
      date: '2026-10-19',
      round: 'Matchday 8',
      homeTeamId: 'club-sample-home',
      awayTeamId: 'club-sample-away',
      homeGoals: 2,
      awayGoals: 1,
      appearances: [
        {
          athleteId: 'karlo-brkic',
          teamId: 'club-sample-home',
          started: true,
          minutes: 90,
          goals: 2,
          assists: 0,
          yellowCards: 0,
          redCard: false,
        },
      ],
      status: 'draft',
    })
    await harness.fixture.whenStable()
    harness.detectChanges()
    expect(root.textContent).toContain('Edit football match')
    clickSave(root)
    await harness.fixture.whenStable()
    const request = http.expectOne(footballDraftUpdatePath('match-sample-league'))
    const body = request.request.body as Record<string, unknown>
    expect(body['status']).toBeUndefined()
    expect(body['appearances']).toEqual([
      {
        athleteId: 'karlo-brkic',
        teamId: 'club-sample-home',
        started: true,
        minutes: 90,
        goals: 2,
        assists: 0,
        yellowCards: 0,
        redCard: false,
      },
    ])
    request.flush({ id: 'match-sample-league', status: 'draft', sport: 'football' })
    await harness.fixture.whenStable()
  })

  it('shows Match not found for an unknown id', async () => {
    const { harness, http, root, draftRequest } = await bootEdit('match-missing')
    draftRequest.flush(null, { status: 404, statusText: 'Not Found' })
    await harness.fixture.whenStable()
    harness.detectChanges()
    expect(root.textContent).toContain('Match not found')
  })
})
