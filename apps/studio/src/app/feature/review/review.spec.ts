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
const ar = (id: string) =>
  ({
    snapshot: { paramMap: { get: (k: string) => (k === 'id' ? id : null) } },
  }) as unknown as ActivatedRoute
const em = (p: Partial<EditorMatch> & Pick<EditorMatch, 'id' | 'sport'>): EditorMatch => ({
  competition: 'C',
  date: '2026-10-16',
  round: 'R1',
  status: 'review',
  source: 'manual',
  label: 'L',
  ...p,
})
const pg = (items: EditorMatch[]): EditorMatchPage => ({
  items: [...items],
  limit: 20,
  offset: 0,
  total: items.length,
})
const ten: EditorTennisDraft = {
  id: QF,
  competitionId: 'ca',
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
const fb: EditorFootballDraft = {
  id: FBL,
  competitionId: 'cf',
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
const mem = (): TokenStore => {
  let v: string | null = null
  return {
    read: () => v,
    write: (t: string) => {
      v = t
    },
    clear: () => {
      v = null
    },
  }
}
const bw = (role: 'editor' | 'admin') => {
  const p = btoa(
    JSON.stringify({ sub: `${role}-demo`, role, exp: Math.floor(Date.now() / 1000) + 3600 }),
  )
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `e.${p}.s`
}
const rtQf: Route[] = [
  { path: 'matches/:id/review', component: ReviewPage, canActivate: [editorGuard] },
  { path: 'matches/:id/tennis', component: class {} },
]

async function mod(routes: Route[], route: ActivatedRoute): Promise<void> {
  TestBed.resetTestingModule()
  await TestBed.configureTestingModule({
    imports: [ReviewPage],
    providers: [
      provideRouter(routes),
      { provide: ActivatedRoute, useValue: route },
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      { provide: TOKEN_STORE, useValue: mem() },
    ],
  }).compileComponents()
}

function tenFl(h: HttpTestingController, d = ten): void {
  h.expectOne(editorMatchesPath).flush(
    pg([em({ id: QF, sport: 'tennis', label: 'x', status: d.status })]),
  )
  h.expectNone((q) => q.method === 'GET' && q.url.includes('/matches/football/'))
  h.expectOne(editorTennisDraftPath(QF)).flush(d)
  h.expectOne((q) => q.url === editorCompetitionsPath && q.params.get('sport') === 'tennis').flush([
    { id: 'ca', name: 'Cup', season: '2026' },
  ])
  h.expectOne((q) => q.url === editorAthletesPath && q.params.get('sport') === 'tennis').flush([
    { id: 'pa', name: 'Aname' },
    { id: 'pb', name: 'Bname' },
  ])
}

function fbFl(h: HttpTestingController): void {
  h.expectOne(editorMatchesPath).flush(pg([em({ id: FBL, sport: 'football' })]))
  h.expectNone((q) => q.method === 'GET' && q.url.includes('/matches/tennis/'))
  h.expectOne(editorFootballDraftPath(FBL)).flush(fb)
  h.expectOne(
    (q) => q.url === editorCompetitionsPath && q.params.get('sport') === 'football',
  ).flush([{ id: 'cf', name: 'League', season: '2026' }])
  h.expectOne((q) => q.url === editorAthletesPath && q.params.get('sport') === 'football').flush([
    { id: 'x', name: 'P1' },
  ])
  h.expectOne(editorTeamsPath).flush([
    { id: 'h', name: 'Home' },
    { id: 'a', name: 'Away' },
  ])
}

function click(root: HTMLElement, label: string): void {
  ;[...root.querySelectorAll('button')]
    .find((b) => b.textContent?.includes(label))
    ?.dispatchEvent(new MouseEvent('click'))
}

async function boot(
  role: 'editor' | 'admin',
): Promise<{ fx: ComponentFixture<ReviewPage>; h: HttpTestingController }> {
  await mod(rtQf, ar(QF))
  TestBed.inject(TOKEN_STORE).write(bw(role))
  return { fx: TestBed.createComponent(ReviewPage), h: TestBed.inject(HttpTestingController) }
}

describe('ReviewPage', () => {
  let fx: ComponentFixture<ReviewPage>
  let h: HttpTestingController

  beforeEach(async () => {
    const o = await boot('editor')
    fx = o.fx
    h = o.h
  })

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
    TestBed.resetTestingModule()
  })

  it('tennis', async () => {
    fx.detectChanges()
    tenFl(h)
    await fx.whenStable()
    const t = (fx.nativeElement as HTMLElement).textContent ?? ''
    expect(t).toContain('Aname')
    expect(t).toContain('Set 1')
    expect(t).toContain('tiebreak 5')
    expect(t).toContain('Winner')
  })

  it('football order', async () => {
    await mod(
      [
        { path: 'matches/:id/review', component: ReviewPage, canActivate: [editorGuard] },
        { path: 'matches/:id/football', component: class {} },
      ],
      ar(FBL),
    )
    TestBed.inject(TOKEN_STORE).write(bw('editor'))
    h = TestBed.inject(HttpTestingController)
    fx = TestBed.createComponent(ReviewPage)
    fx.detectChanges()
    fbFl(h)
    await fx.whenStable()
    expect((fx.nativeElement as HTMLElement).textContent).toContain('Home')
  })

  it('404', async () => {
    await mod([{ path: 'matches/:id/review', component: ReviewPage }], {
      snapshot: { paramMap: { get: () => 'missing' } },
    } as unknown as ActivatedRoute)
    h = TestBed.inject(HttpTestingController)
    TestBed.inject(TOKEN_STORE).write(bw('editor'))
    const f = TestBed.createComponent(ReviewPage)
    f.detectChanges()
    h.expectOne(editorMatchesPath).flush(pg([]))
    await f.whenStable()
    expect((f.nativeElement as HTMLElement).textContent).toContain('Match not found')
  })

  it('admin', async () => {
    let { fx: f, h: x } = await boot('admin')
    f.detectChanges()
    tenFl(x)
    await f.whenStable()
    let el = f.nativeElement as HTMLElement
    click(el, 'Reject')
    x.expectOne(matchRejectPath(QF)).flush({ id: QF, status: 'draft' })
    await f.whenStable()
    f.detectChanges()
    expect(el.textContent).toContain('draft')
    ;({ fx: f, h: x } = await boot('admin'))
    f.detectChanges()
    tenFl(x, ten)
    await f.whenStable()
    el = f.nativeElement as HTMLElement
    click(el, 'Publish')
    x.expectOne(matchPublishPath(QF)).flush({ id: QF, status: 'published' })
    await f.whenStable()
    expect(el.textContent).toContain('published')
    ;({ fx: f, h: x } = await boot('admin'))
    f.detectChanges()
    tenFl(x)
    await f.whenStable()
    el = f.nativeElement as HTMLElement
    click(el, 'Publish')
    x.expectOne(matchPublishPath(QF)).flush(
      { message: 'conflict' },
      { status: 409, statusText: 'Conflict' },
    )
    await f.whenStable()
    expect(el.textContent).toContain('conflict')
  })

  it('hide actions', async () => {
    fx.detectChanges()
    tenFl(h)
    await fx.whenStable()
    expect((fx.nativeElement as HTMLElement).textContent).not.toContain('Reject')
    const { fx: f, h: x } = await boot('admin')
    f.detectChanges()
    tenFl(x, { ...ten, status: 'draft' })
    await f.whenStable()
    expect((f.nativeElement as HTMLElement).textContent).not.toContain('Reject')
  })
})
