import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { ActivatedRoute, type Route, provideRouter } from '@angular/router'
import { expect } from 'vite-plus/test'
import type {
  EditorFootballDraft,
  EditorMatch,
  EditorMatchPage,
  EditorTennisDraft,
} from '@cro-sport-hub/shared-types'
import { authInterceptor, editorGuard, TOKEN_STORE, type TokenStore } from '../../core/auth'
import {
  editorAthletesPath,
  editorCompetitionsPath,
  editorTeamsPath,
} from '../../core/editor-lookups-api'
import { editorFootballDraftPath } from '../../core/football-api'
import { editorMatchesPath } from '../../core/matches-api'
import { matchPublishPath, matchRejectPath } from '../../core/review-api'
import { editorTennisDraftPath } from '../../core/tennis-api'
import { ReviewPage } from './review'

const QF = 'match-sample-qf'
const FBL = 'match-sample-league'

const AR = (id: string) =>
  ({
    snapshot: { paramMap: { get: (k: string) => (k === 'id' ? id : null) } },
  }) as unknown as ActivatedRoute

const em = (partial: Partial<EditorMatch> & Pick<EditorMatch, 'id' | 'sport'>): EditorMatch => ({
  competition: 'C',
  date: '2026-10-16',
  round: 'R1',
  status: 'review',
  source: 'manual',
  label: 'L',
  ...partial,
})

const list = (items: EditorMatch[]): EditorMatchPage => ({
  items: [...items],
  limit: 20,
  offset: 0,
  total: items.length,
})

const tenDraft: EditorTennisDraft = {
  id: QF,
  competitionId: 'comp-a',
  date: '2026-10-16',
  round: 'QF',
  playerAId: 'pa',
  playerBId: 'pb',
  winnerId: 'pa',
  bestOf: 3,
  score: [
    [6, 4],
    [7, 6, 5],
  ],
  status: 'review',
}

const fbDraft: EditorFootballDraft = {
  id: FBL,
  competitionId: 'comp-f',
  date: '2026-10-17',
  round: 'MD1',
  homeTeamId: 'h',
  awayTeamId: 'a',
  homeGoals: 2,
  awayGoals: 1,
  appearances: [
    {
      athleteId: 'x',
      teamId: 'h',
      started: true,
      minutes: 90,
      goals: 1,
      assists: 0,
      yellowCards: 1,
      redCard: false,
    },
  ],
  status: 'review',
}

function store(): TokenStore {
  let v: string | null = null
  return {
    read: () => v,
    write: (t) => {
      v = t
    },
    clear: () => {
      v = null
    },
  }
}

function jwt(role: 'editor' | 'admin'): string {
  const exp = Math.floor(Date.now() / 1000) + 3600
  const payload = btoa(JSON.stringify({ sub: `${role}-demo`, role, exp }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

async function mod(routes: Route[], ar: ActivatedRoute): Promise<void> {
  TestBed.resetTestingModule()
  await TestBed.configureTestingModule({
    imports: [ReviewPage],
    providers: [
      provideRouter(routes),
      { provide: ActivatedRoute, useValue: ar },
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      { provide: TOKEN_STORE, useValue: store() },
    ],
  }).compileComponents()
}

function flushTen(h: HttpTestingController, d = tenDraft): void {
  h.expectOne(editorMatchesPath).flush(
    list([em({ id: QF, sport: 'tennis', label: 'x', status: d.status })]),
  )
  h.expectNone((req) => req.method === 'GET' && req.url.includes('/matches/football/'))
  h.expectOne(editorTennisDraftPath(QF)).flush(d)
  h.expectOne((r) => r.url === editorCompetitionsPath && r.params.get('sport') === 'tennis').flush([
    { id: 'comp-a', name: 'Cup', season: '2026' },
  ])
  h.expectOne((r) => r.url === editorAthletesPath && r.params.get('sport') === 'tennis').flush([
    { id: 'pa', name: 'Aname' },
    { id: 'pb', name: 'Bname' },
  ])
}

function flushFb(h: HttpTestingController): void {
  h.expectOne(editorMatchesPath).flush(list([em({ id: FBL, sport: 'football' })]))
  h.expectNone((req) => req.method === 'GET' && req.url.includes('/matches/tennis/'))
  h.expectOne(editorFootballDraftPath(FBL)).flush(fbDraft)
  h.expectOne(
    (r) => r.url === editorCompetitionsPath && r.params.get('sport') === 'football',
  ).flush([{ id: 'comp-f', name: 'League', season: '2026' }])
  h.expectOne((r) => r.url === editorAthletesPath && r.params.get('sport') === 'football').flush([
    { id: 'x', name: 'P1' },
  ])
  h.expectOne(editorTeamsPath).flush([
    { id: 'h', name: 'Home' },
    { id: 'a', name: 'Away' },
  ])
}

const routesQf: Route[] = [
  { path: 'matches/:id/review', component: ReviewPage, canActivate: [editorGuard] },
  { path: 'matches/:id/tennis', component: class {} },
]

async function boot(
  role: 'editor' | 'admin',
  r: Route[] = routesQf,
  ar: ActivatedRoute = AR(QF),
): Promise<{ fx: ComponentFixture<ReviewPage>; http: HttpTestingController }> {
  await mod(r, ar)
  TestBed.inject(TOKEN_STORE).write(jwt(role))
  const fx = TestBed.createComponent(ReviewPage)
  return { fx, http: TestBed.inject(HttpTestingController) }
}

describe('ReviewPage', () => {
  let fx: ComponentFixture<ReviewPage>
  let http: HttpTestingController

  beforeEach(async () => {
    const p = await boot('editor')
    fx = p.fx
    http = p.http
  })

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
    TestBed.resetTestingModule()
  })

  it('tennis detail', async () => {
    fx.detectChanges()
    flushTen(http)
    await fx.whenStable()
    const t = (fx.nativeElement as HTMLElement).textContent ?? ''
    expect(t).toContain('Aname')
    expect(t).toContain('Set 1')
    expect(t).toContain('7-6 (tiebreak 5)')
    expect(t).toContain('Winner')
  })

  it('football order: list, no tennis GET', async () => {
    await mod(
      [
        { path: 'matches/:id/review', component: ReviewPage, canActivate: [editorGuard] },
        { path: 'matches/:id/football', component: class {} },
      ],
      AR(FBL),
    )
    TestBed.inject(TOKEN_STORE).write(jwt('editor'))
    http = TestBed.inject(HttpTestingController)
    fx = TestBed.createComponent(ReviewPage)
    fx.detectChanges()
    flushFb(http)
    await fx.whenStable()
    expect((fx.nativeElement as HTMLElement).textContent).toContain('Home')
  })

  it('missing id 404', async () => {
    await mod([{ path: 'matches/:id/review', component: ReviewPage }], {
      snapshot: { paramMap: { get: () => 'missing' } },
    } as unknown as ActivatedRoute)
    http = TestBed.inject(HttpTestingController)
    TestBed.inject(TOKEN_STORE).write(jwt('editor'))
    const f = TestBed.createComponent(ReviewPage)
    f.detectChanges()
    http.expectOne(editorMatchesPath).flush(list([]))
    await f.whenStable()
    expect((f.nativeElement as HTMLElement).textContent).toContain('Match not found')
  })

  it('admin reject, publish, 409', async () => {
    let { fx: f, http: h } = await boot('admin')
    f.detectChanges()
    flushTen(h)
    await f.whenStable()
    let el = f.nativeElement as HTMLElement
    ;[...el.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Reject'))
      ?.dispatchEvent(new MouseEvent('click'))
    h.expectOne(matchRejectPath(QF)).flush({ id: QF, status: 'draft' })
    await f.whenStable()
    f.detectChanges()
    expect(el.textContent).toContain('draft')

    ;({ fx: f, http: h } = await boot('admin'))
    f.detectChanges()
    flushTen(h, tenDraft)
    await f.whenStable()
    el = f.nativeElement as HTMLElement
    ;[...el.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Publish'))
      ?.dispatchEvent(new MouseEvent('click'))
    h.expectOne(matchPublishPath(QF)).flush({ id: QF, status: 'published' })
    await f.whenStable()
    expect(el.textContent).toContain('published')

    ;({ fx: f, http: h } = await boot('admin'))
    f.detectChanges()
    flushTen(h)
    await f.whenStable()
    el = f.nativeElement as HTMLElement
    ;[...el.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Publish'))
      ?.dispatchEvent(new MouseEvent('click'))
    h.expectOne(matchPublishPath(QF)).flush(
      { message: 'conflict' },
      { status: 409, statusText: 'Conflict' },
    )
    await f.whenStable()
    expect(el.textContent).toContain('conflict')
  })

  it('editor hides admin actions; draft hides actions', async () => {
    fx.detectChanges()
    flushTen(http)
    await fx.whenStable()
    expect((fx.nativeElement as HTMLElement).textContent).not.toContain('Reject')
    const { fx: f, http: h } = await boot('admin')
    f.detectChanges()
    flushTen(h, { ...tenDraft, status: 'draft' })
    await f.whenStable()
    expect((f.nativeElement as HTMLElement).textContent).not.toContain('Reject')
  })
})
