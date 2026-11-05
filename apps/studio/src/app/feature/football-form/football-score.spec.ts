import { Component } from '@angular/core'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import type { WritableSignal } from '@angular/core'
import type { CompetitionLookup, TeamLookup } from '@cro-sport-hub/shared-types'
import { authInterceptor, editorGuard, TOKEN_STORE, type TokenStore } from '../../core/auth'
import { editorCompetitionsPath, editorTeamsPath, footballDraftsPath } from '../../core/studio-api'
import type { FootballFormModel } from './draft-body'
import { FootballScorePage } from './football-score'

const competitions: CompetitionLookup[] = [
  { id: 'comp-sample-league', name: 'Sample League', season: '2026' },
]
const teams: TeamLookup[] = [
  { id: 'club-sample-home', name: 'Sample Home' },
  { id: 'club-sample-away', name: 'Sample Away' },
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

function modelSignal(
  fixture: ComponentFixture<FootballScorePage>,
): WritableSignal<FootballFormModel> {
  return (fixture.componentInstance as unknown as { model: WritableSignal<FootballFormModel> })
    .model
}

function clickSave(root: HTMLElement): void {
  ;[...root.querySelectorAll('button')]
    .find((button) => button.textContent?.includes('Save draft'))
    ?.click()
}

function fillValidScore(model: WritableSignal<FootballFormModel>): void {
  model.set({
    competitionId: 'comp-sample-league',
    date: '2026-10-20',
    round: 'Matchday 11',
    homeTeamId: 'club-sample-home',
    awayTeamId: 'club-sample-away',
    homeGoals: '1',
    awayGoals: '0',
  })
}

async function boot(): Promise<{
  fixture: ComponentFixture<FootballScorePage>
  http: HttpTestingController
  root: HTMLElement
}> {
  const fixture = TestBed.createComponent(FootballScorePage)
  fixture.detectChanges()
  const http = TestBed.inject(HttpTestingController)
  const root = fixture.nativeElement as HTMLElement
  http.expectOne(`${editorCompetitionsPath}?sport=football`).flush(competitions)
  http.expectOne(editorTeamsPath).flush(teams)
  await fixture.whenStable()
  fixture.detectChanges()
  return { fixture, http, root }
}

describe('FootballScorePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FootballScorePage],
      providers: [
        provideRouter([
          {
            path: 'matches/new/football',
            component: FootballScorePage,
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
    http.expectNone(footballDraftsPath)
  })

  it('posts a valid score without appearances or status', async () => {
    const { fixture, http, root } = await boot()
    fillValidScore(modelSignal(fixture))
    fixture.detectChanges()
    clickSave(root)
    await fixture.whenStable()
    const request = http.expectOne(footballDraftsPath)
    const body = request.request.body as Record<string, unknown>
    expect(body['status']).toBeUndefined()
    expect(body['appearances']).toBeUndefined()
    expect(body['homeTeamId']).toBe('club-sample-home')
    expect(body['awayTeamId']).toBe('club-sample-away')
    expect(body['homeGoals']).toBe(1)
    expect(body['awayGoals']).toBe(0)
    request.flush({ id: 'match-new-draft', status: 'draft', sport: 'football' })
    await fixture.whenStable()
    fixture.detectChanges()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(root.textContent).toContain('match-new-draft')
    http.expectNone(footballDraftsPath)
  })

  it('shows the same-club message and sends nothing', async () => {
    const { fixture, http, root } = await boot()
    modelSignal(fixture).set({
      competitionId: 'comp-sample-league',
      date: '2026-10-20',
      round: 'Matchday 11',
      homeTeamId: 'club-sample-home',
      awayTeamId: 'club-sample-home',
      homeGoals: '1',
      awayGoals: '0',
    })
    fixture.detectChanges()
    clickSave(root)
    await fixture.whenStable()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(root.textContent).toContain('Home and away clubs must be different')
    http.expectNone(footballDraftsPath)
  })
})

describe('FootballScorePage guest', () => {
  @Component({ template: '' })
  class LoginProbe {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FootballScorePage, LoginProbe],
      providers: [
        provideRouter([
          { path: 'login', component: LoginProbe },
          {
            path: 'matches/new/football',
            component: FootballScorePage,
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
    await TestBed.inject(Router).navigateByUrl('/matches/new/football')
    expect(TestBed.inject(Router).url).toBe('/login')
  })
})
