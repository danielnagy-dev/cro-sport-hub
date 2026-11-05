import { Component } from '@angular/core'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import type { EditorMatch, EditorMatchPage } from '@cro-sport-hub/shared-types'
import { authInterceptor, editorGuard, TOKEN_STORE, type TokenStore } from '../../core/auth'
import { editorMatchesPath } from '../../core/matches-api'
import { MatchesPage } from './matches'

const finalMatch: EditorMatch = {
  id: 'match-sample-final',
  sport: 'tennis',
  competition: 'Sample Cup',
  date: '2026-10-18',
  round: 'Final',
  status: 'published',
  source: 'manual',
  label: 'Sample Player A vs Sample Player B',
}
const quarterMatch: EditorMatch = {
  id: 'match-sample-qf',
  sport: 'tennis',
  competition: 'Sample Cup',
  date: '2026-10-16',
  round: 'QF',
  status: 'draft',
  source: 'manual',
  label: 'Sample Player C vs Sample Player D',
}
const leagueMatch: EditorMatch = {
  id: 'match-sample-league',
  sport: 'football',
  competition: 'Sample League',
  date: '2026-10-19',
  round: 'Matchday 8',
  status: 'published',
  source: 'manual',
  label: 'Sample Home vs Sample Away',
}

function page(items: readonly EditorMatch[], total?: number): EditorMatchPage {
  return { items: [...items], limit: 20, offset: 0, total: total ?? items.length }
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

function bearer(exp: number): string {
  const payload = btoa(JSON.stringify({ sub: 'editor-demo', role: 'editor', exp }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

function pickSelect(root: ParentNode, id: string, value: string): void {
  const element = root.querySelector(`#${id}`)
  if (!(element instanceof HTMLSelectElement)) throw new Error(`missing #${id}`)
  element.value = value
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('MatchesPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchesPage],
      providers: [
        provideRouter([{ path: 'matches', component: MatchesPage, canActivate: [editorGuard] }]),
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

  it('lists rows and sends filter query params', async () => {
    const fixture = TestBed.createComponent(MatchesPage)
    fixture.detectChanges()
    const http = TestBed.inject(HttpTestingController)
    const root = fixture.nativeElement as HTMLElement
    http.expectOne(editorMatchesPath).flush(page([finalMatch, quarterMatch]))
    await fixture.whenStable()
    expect(root.querySelector('table')).toBeInstanceOf(HTMLTableElement)
    expect(root.textContent).toContain('draft')

    pickSelect(root, 'filter-status', 'draft')
    http.expectOne(`${editorMatchesPath}?status=draft`).flush(page([quarterMatch], 1))
    await fixture.whenStable()
    pickSelect(root, 'filter-status', '')
    http.expectOne(editorMatchesPath).flush(page([finalMatch, quarterMatch]))
    await fixture.whenStable()
    pickSelect(root, 'filter-sport', 'football')
    http.expectOne(`${editorMatchesPath}?sport=football`).flush(page([]))
    await fixture.whenStable()
    expect(root.textContent).toContain('No matches.')
  })

  it('shows a load error and keeps native filters', async () => {
    const fixture = TestBed.createComponent(MatchesPage)
    fixture.detectChanges()
    const http = TestBed.inject(HttpTestingController)
    const root = fixture.nativeElement as HTMLElement
    http.expectOne(editorMatchesPath).flush(null, { status: 500, statusText: 'Error' })
    await fixture.whenStable()
    expect(root.textContent).toContain('The match list could not be loaded.')
    expect(root.querySelector('select')).toBeInstanceOf(HTMLSelectElement)
    pickSelect(root, 'filter-status', 'draft')
    http.expectOne(`${editorMatchesPath}?status=draft`).flush(page([quarterMatch], 1))
    await fixture.whenStable()
    expect(root.textContent).toContain('Sample Player C vs Sample Player D')
    const link = root.querySelector('a[href="/matches/match-sample-qf/tennis"]')
    expect(link?.textContent).toContain('Sample Player C vs Sample Player D')
  })

  it('links football rows to the edit route', async () => {
    const fixture = TestBed.createComponent(MatchesPage)
    fixture.detectChanges()
    const http = TestBed.inject(HttpTestingController)
    const root = fixture.nativeElement as HTMLElement
    http.expectOne(editorMatchesPath).flush(page([leagueMatch]))
    await fixture.whenStable()
    const link = root.querySelector('a[href="/matches/match-sample-league/football"]')
    expect(link?.textContent).toContain('Sample Home vs Sample Away')
  })
})

describe('MatchesPage guest', () => {
  @Component({ template: '' })
  class LoginProbe {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchesPage, LoginProbe],
      providers: [
        provideRouter([
          { path: 'login', component: LoginProbe },
          { path: 'matches', component: MatchesPage, canActivate: [editorGuard] },
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
    await TestBed.inject(Router).navigateByUrl('/matches')
    expect(TestBed.inject(Router).url).toBe('/login')
  })
})
