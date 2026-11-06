import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { ActivatedRoute, provideRouter } from '@angular/router'
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

const listRow: EditorMatch = {
  id: QF,
  sport: 'tennis',
  competition: 'Sample Cup',
  date: '2026-10-16',
  round: 'QF',
  status: 'review',
  source: 'manual',
  label: 'Sample Player C vs Sample Player D',
}

const tennisDraft: EditorTennisDraft = {
  id: QF,
  competitionId: 'comp-sample-cup',
  date: '2026-10-16',
  round: 'QF',
  playerAId: 'sample-player-c',
  playerBId: 'sample-player-d',
  winnerId: 'sample-player-c',
  bestOf: 3,
  score: [
    [6, 4],
    [7, 6, 5],
  ],
  status: 'review',
}

const draftTennis: EditorTennisDraft = { ...tennisDraft, status: 'draft' }

const footballDraft: EditorFootballDraft = {
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

const pg = (items: readonly EditorMatch[]): EditorMatchPage => ({
  items: [...items],
  limit: 20,
  offset: 0,
  total: items.length,
})

function mem(): TokenStore {
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

const jwt = (role: 'editor' | 'admin') => {
  const p = btoa(
    JSON.stringify({ sub: `${role}-demo`, role, exp: Math.floor(Date.now() / 1000) + 3600 }),
  )
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `ey.${p}.s`
}

function btn(r: HTMLElement, lab: string): void {
  const b = [...r.querySelectorAll('button')].find((n) => n.textContent?.includes(lab))
  if (b === undefined) throw new Error(lab)
  b.click()
}

function ft(h: HttpTestingController, id: string, d: EditorTennisDraft): void {
  h.expectOne(editorMatchesPath).flush(pg([{ ...listRow, id, sport: 'tennis', status: d.status }]))
  h.expectNone((q) => q.method === 'GET' && q.url.includes('/matches/football/'))
  h.expectOne(editorTennisDraftPath(id)).flush(d)
  h.expectOne((q) => q.url === editorCompetitionsPath && q.params.get('sport') === 'tennis').flush([
    { id: d.competitionId, name: 'Cup', season: '2026' },
  ])
  h.expectOne((q) => q.url === editorAthletesPath && q.params.get('sport') === 'tennis').flush([
    { id: d.playerAId, name: 'Aname' },
    { id: d.playerBId, name: 'Bname' },
  ])
}

function ff(h: HttpTestingController): void {
  h.expectOne(editorMatchesPath).flush(
    pg([
      {
        id: FBL,
        sport: 'football',
        competition: 'L',
        date: '2026-10-17',
        round: 'MD1',
        status: 'review',
        source: 'manual',
        label: 'H vs A',
      },
    ]),
  )
  h.expectNone((q) => q.method === 'GET' && q.url.includes('/matches/tennis/'))
  h.expectOne(editorFootballDraftPath(FBL)).flush(footballDraft)
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

describe('ReviewPage', () => {
  let fx: ComponentFixture<ReviewPage>
  let h: HttpTestingController
  let root: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewPage],
      providers: [
        provideRouter([
          { path: 'matches/:id/review', component: ReviewPage, canActivate: [editorGuard] },
          { path: 'matches/:id/tennis', component: class {} },
        ]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'id' ? QF : null) } } },
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: mem() },
      ],
    }).compileComponents()
    h = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
    TestBed.resetTestingModule()
  })

  async function open(role: 'editor' | 'admin', d: EditorTennisDraft = tennisDraft): Promise<void> {
    TestBed.inject(TOKEN_STORE).write(jwt(role))
    fx = TestBed.createComponent(ReviewPage)
    fx.detectChanges()
    ft(h, QF, d)
    await fx.whenStable()
    fx.detectChanges()
    root = fx.nativeElement as HTMLElement
  }

  it('editor sees tennis detail', async () => {
    await open('editor')
    expect(root.textContent).toContain(listRow.label)
    expect(root.textContent).toContain('Set 1')
    expect(root.textContent).toContain('tiebreak 5')
    expect(root.textContent).toContain('Winner')
    expect(root.textContent).toContain('Edit tennis match')
    expect(root.textContent).not.toContain('Reject')
  })

  it('football order', async () => {
    TestBed.resetTestingModule()
    await TestBed.configureTestingModule({
      imports: [ReviewPage],
      providers: [
        provideRouter([
          { path: 'matches/:id/review', component: ReviewPage, canActivate: [editorGuard] },
          { path: 'matches/:id/football', component: class {} },
        ]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'id' ? FBL : null) } } },
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: mem() },
      ],
    }).compileComponents()
    h = TestBed.inject(HttpTestingController)
    TestBed.inject(TOKEN_STORE).write(jwt('editor'))
    fx = TestBed.createComponent(ReviewPage)
    fx.detectChanges()
    ff(h)
    await fx.whenStable()
    expect((fx.nativeElement as HTMLElement).textContent).toContain('Home')
  })

  it('404', async () => {
    TestBed.resetTestingModule()
    await TestBed.configureTestingModule({
      imports: [ReviewPage],
      providers: [
        provideRouter([{ path: 'matches/:id/review', component: ReviewPage }]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'match-missing' } } },
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: mem() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(jwt('editor'))
    fx = TestBed.createComponent(ReviewPage)
    fx.detectChanges()
    TestBed.inject(HttpTestingController).expectOne(editorMatchesPath).flush(pg([]))
    await fx.whenStable()
    expect((fx.nativeElement as HTMLElement).textContent).toContain('Match not found')
  })

  it('admin flows', async () => {
    await open('admin', draftTennis)
    expect(root.textContent).not.toContain('Reject')
    await open('admin')
    btn(root, 'Reject')
    h.expectOne(matchRejectPath(QF)).flush({ id: QF, status: 'draft' })
    await fx.whenStable()
    fx.detectChanges()
    expect(root.textContent).toContain('draft')
    await open('admin')
    btn(root, 'Publish')
    h.expectOne(matchPublishPath(QF)).flush({ id: QF, status: 'published' })
    await fx.whenStable()
    fx.detectChanges()
    expect(root.textContent).toContain('published')
    await open('admin')
    btn(root, 'Publish')
    h.expectOne(matchPublishPath(QF)).flush(
      { message: 'Only a match in review can be published' },
      { status: 409, statusText: 'Conflict' },
    )
    await fx.whenStable()
    fx.detectChanges()
    expect(root.textContent).toContain('Only a match in review can be published')
  })
})
