import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { ActivatedRoute, provideRouter } from '@angular/router'
import { expect } from 'vite-plus/test'
import type { EditorMatch, EditorMatchPage, EditorTennisDraft } from '@cro-sport-hub/shared-types'
import { authInterceptor, editorGuard, TOKEN_STORE, type TokenStore } from '../../core/auth'
import { editorMatchesPath } from '../../core/matches-api'
import { matchPublishPath, matchRejectPath } from '../../core/review-api'
import { editorTennisDraftPath } from '../../core/tennis-api'
import { ReviewPage } from './review'

const quarterfinal = 'match-sample-qf'

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
    [6, 3],
  ],
  status: 'review',
}

const draftTennis: EditorTennisDraft = { ...tennisDraft, status: 'draft' }

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
  http.expectOne(editorTennisDraftPath(id)).flush(draft)
  http
    .expectOne(`${editorMatchesPath}?sport=tennis`)
    .flush(page([{ ...listRow, id, status: draft.status }]))
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
    http.verify()
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
    missingHttp.expectOne(editorTennisDraftPath('match-missing')).flush('Unknown match', {
      status: 404,
      statusText: 'Not Found',
    })
    missingHttp.expectOne('/api/editor/matches/football/match-missing').flush('Unknown match', {
      status: 404,
      statusText: 'Not Found',
    })
    await fixture.whenStable()
    fixture.detectChanges()
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Match not found')
    missingHttp.verify()
  })

  it('hides Reject and Publish for an editor but keeps Edit', async () => {
    await open('editor')
    expect(root.textContent).toContain(listRow.label)
    expect(root.textContent).toContain('review')
    expect(root.textContent).toContain('Edit tennis match')
    expect(root.textContent).not.toContain('Reject')
    expect(root.textContent).not.toContain('Publish')
  })

  it('hides admin actions when the row is not in review', async () => {
    await open('admin', draftTennis)
    expect(root.textContent).toContain('draft')
    expect(root.textContent).not.toContain('Reject')
    expect(root.textContent).not.toContain('Publish')
  })

  it('rejects a review row and shows draft', async () => {
    await open('admin')
    clickButton(root, 'Reject')
    http.expectOne(matchRejectPath(quarterfinal)).flush({ id: quarterfinal, status: 'draft' })
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain('draft')
  })

  it('publishes a review row and shows published', async () => {
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
