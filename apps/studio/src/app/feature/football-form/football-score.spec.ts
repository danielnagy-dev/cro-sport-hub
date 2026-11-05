import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import { authInterceptor, editorGuard, TOKEN_STORE, type TokenStore } from '../../core/auth'
import { editorCompetitionsPath, editorTeamsPath, footballDraftsPath } from '../../core/studio-api'
import type { FootballFormModel } from './draft-body'
import { FootballScorePage } from './football-score'

const valid: FootballFormModel = {
  competitionId: 'comp-sample-league',
  date: '2026-10-20',
  round: 'Matchday 11',
  homeTeamId: 'club-sample-home',
  awayTeamId: 'club-sample-away',
  homeGoals: '1',
  awayGoals: '0',
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
  await fixture.whenStable()
  fixture.detectChanges()
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

  afterEach(() => TestBed.inject(HttpTestingController).verify())

  it('sends a guest to login', async () => {
    TestBed.inject(TOKEN_STORE).clear()
    await TestBed.inject(Router).navigateByUrl('/matches/new/football')
    expect(TestBed.inject(Router).url).toBe('/login')
  })

  it('validates and posts a score without appearances or status', async () => {
    const http = TestBed.inject(HttpTestingController)
    const fixture = await boot(http)
    const root = fixture.nativeElement as HTMLElement
    const model = (
      fixture.componentInstance as unknown as { model: { set: (v: FootballFormModel) => void } }
    ).model
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
})
