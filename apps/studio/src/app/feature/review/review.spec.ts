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

const quarterfinal = 'match-sample-qf'
const league = 'match-sample-league'

const listRow: EditorMatch = {
  id: quarterfinal,
  sport: 'tennis',
  competition: 'Sample Cup',
  date: '2026-10-16',
  round: 'QF',
  status: 'review',
  source: 'manual',
  label: 'Sample Player C vs Sample Player D',
}

const tennisDraft: EditorTennisDraft = {
  id: quarterfinal,
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
  id: league,
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
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCard: false,
    },
  ],
  status: 'review',
}

function page(items: readonly EditorMatch[]): EditorMatchPage {
  return { items: [...items], limit: 20, offset: 0, total: items.length }
}

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

function bearer(role: 'editor' | 'admin', exp: number): string {
  const payload = btoa(JSON.stringify({ sub: `${role}-demo`, role, exp }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

function clickButton(root: HTMLElement, label: string): void {
  const button = [...root.querySelectorAll('button')].find((node) =>
    node.textContent?.includes(label),
  )
  if (button === undefined) throw new Error(`missing ${label}`)
  button.click()
}

function flushLoad(http: HttpTestingController, id: string, draft: EditorTennisDraft): void {
  http
    .expectOne(editorMatchesPath)
    .flush(page([{ ...listRow, id, sport: 'tennis', status: draft.status }]))
  http.expectNone((q) => q.method === 'GET' && q.url.includes('/matches/football/'))
  http.expectOne(editorTennisDraftPath(id)).flush(draft)
  http
    .expectOne((q) => q.url === editorCompetitionsPath && q.params.get('sport') === 'tennis')
    .flush([{ id: draft.competitionId, name: 'Sample Cup', season: '2026' }])
  http
    .expectOne((q) => q.url === editorAthletesPath && q.params.get('sport') === 'tennis')
    .flush([
      { id: draft.playerAId, name: 'Sample Player C' },
      { id: draft.playerBId, name: 'Sample Player D' },
    ])
}

function flushFootball(http: HttpTestingController): void {
  http.expectOne(editorMatchesPath).flush(
    page([
      {
        id: league,
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
  http.expectNone((q) => q.method === 'GET' && q.url.includes('/matches/tennis/'))
  http.expectOne(editorFootballDraftPath(league)).flush(footballDraft)
  http
    .expectOne((q) => q.url === editorCompetitionsPath && q.params.get('sport') === 'football')
    .flush([{ id: 'cf', name: 'League', season: '2026' }])
  http
    .expectOne((q) => q.url === editorAthletesPath && q.params.get('sport') === 'football')
    .flush([{ id: 'x', name: 'P1' }])
  http.expectOne(editorTeamsPath).flush([
    { id: 'h', name: 'Home' },
    { id: 'a', name: 'Away' },
  ])
}

describe('ReviewPage', () => {
  let fixture: ComponentFixture<ReviewPage>
  let http: HttpTestingController
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
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'id' ? quarterfinal : null) } },
          },
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
    TestBed.resetTestingModule()
  })

  async function open(
    role: 'editor' | 'admin',
    draft: EditorTennisDraft = tennisDraft,
  ): Promise<void> {
    TestBed.inject(TOKEN_STORE).write(bearer(role, Math.floor(Date.now() / 1000) + 3600))
    fixture = TestBed.createComponent(ReviewPage)
    fixture.detectChanges()
    flushLoad(http, quarterfinal, draft)
    await fixture.whenStable()
    fixture.detectChanges()
    root = fixture.nativeElement as HTMLElement
  }

  it('shows Match not found for an unknown id', async () => {
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
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(bearer('editor', Math.floor(Date.now() / 1000) + 3600))
    fixture = TestBed.createComponent(ReviewPage)
    fixture.detectChanges()
    const missingHttp = TestBed.inject(HttpTestingController)
    missingHttp.expectOne(editorMatchesPath).flush(page([]))
    await fixture.whenStable()
    fixture.detectChanges()
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Match not found')
  })

  it('hides Reject and Publish for an editor but keeps Edit', async () => {
    await open('editor')
    expect(root.textContent).toContain(listRow.label)
    expect(root.textContent).toContain('Set 1')
    expect(root.textContent).toContain('tiebreak 5')
    expect(root.textContent).toContain('Winner')
    expect(root.textContent).toContain('Edit tennis match')
    expect(root.textContent).not.toContain('Reject')
    expect(root.textContent).not.toContain('Publish')
  })

  it('loads football after list without tennis draft', async () => {
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
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'id' ? league : null) } },
          },
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    http = TestBed.inject(HttpTestingController)
    TestBed.inject(TOKEN_STORE).write(bearer('editor', Math.floor(Date.now() / 1000) + 3600))
    fixture = TestBed.createComponent(ReviewPage)
    fixture.detectChanges()
    flushFootball(http)
    await fixture.whenStable()
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Home')
  })

  it('hides admin actions when the row is not in review', async () => {
    await open('admin', draftTennis)
    expect(root.textContent).toContain('draft')
    expect(root.textContent).not.toContain('Reject')
    expect(root.textContent).not.toContain('Publish')
  })

  it('reject and publish for admin', async () => {
    await open('admin')
    clickButton(root, 'Reject')
    http.expectOne(matchRejectPath(quarterfinal)).flush({ id: quarterfinal, status: 'draft' })
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain('draft')
    await open('admin')
    clickButton(root, 'Publish')
    http.expectOne(matchPublishPath(quarterfinal)).flush({ id: quarterfinal, status: 'published' })
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain('published')
  })

  it('shows a 409 message from publish', async () => {
    await open('admin')
    clickButton(root, 'Publish')
    http
      .expectOne(matchPublishPath(quarterfinal))
      .flush(
        { message: 'Only a match in review can be published' },
        { status: 409, statusText: 'Conflict' },
      )
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain('Only a match in review can be published')
  })
})
