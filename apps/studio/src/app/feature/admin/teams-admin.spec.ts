import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Component } from '@angular/core'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { teamSchema, type Team } from '@cro-sport-hub/shared-types'
import { expect } from 'vite-plus/test'
import {
  adminGuard,
  authInterceptor,
  editorGuard,
  TOKEN_STORE,
  type TokenStore,
} from '../../core/auth'
import {
  MSG_TEAM_COUNTRY,
  MSG_TEAM_ID,
  MSG_TEAM_NAME,
  MSG_TEAM_SHORT_NAME,
  MSG_TEAM_SLUG,
} from '../../core/admin-form-messages'
import { adminTeamPath, adminTeamsPath } from '../../core/teams-admin-api'
import { TeamsAdminPage } from './teams-admin'

@Component({ template: 'home-page' })
class HomeProbe {}

const home: Team = {
  id: 'club-sample-home',
  sportId: 'sport-football',
  slug: 'sample-home',
  name: 'Sample Home',
  shortName: 'SH',
  country: 'HR',
}
const away: Team = {
  id: 'club-sample-away',
  sportId: 'sport-football',
  slug: 'sample-away',
  name: 'Sample Away',
  shortName: 'SA',
  country: 'HR',
}
const town: Team = {
  id: 'club-sample-town',
  sportId: 'sport-football',
  slug: 'sample-town',
  name: 'Sample Town',
  shortName: 'ST',
  country: 'HR',
}
const north: Team = {
  id: 'sample-north',
  sportId: 'sport-football',
  slug: 'sample-north',
  name: 'Sample North',
  shortName: 'SN',
  country: 'HR',
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

function bearer(role: 'admin' | 'editor', exp: number): string {
  const sub = role === 'admin' ? 'admin-demo' : 'editor-demo'
  const payload = btoa(JSON.stringify({ sub, role, exp }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

function setModel(fixture: ComponentFixture<TeamsAdminPage>, row: Team): void {
  ;(
    fixture.componentInstance as unknown as {
      model: { set(value: unknown): void }
    }
  ).model.set({
    id: row.id,
    sportId: row.sportId,
    slug: row.slug,
    name: row.name,
    shortName: row.shortName,
    country: row.country,
  })
}

describe('TeamsAdminPage', () => {
  let fixture: ComponentFixture<TeamsAdminPage>
  let http: HttpTestingController
  let root: HTMLElement

  beforeEach(async () => {
    globalThis.confirm = () => true
    await TestBed.configureTestingModule({
      imports: [TeamsAdminPage],
      providers: [
        provideRouter([
          {
            path: 'admin/teams',
            component: TeamsAdminPage,
            canActivate: [adminGuard],
          },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(bearer('admin', Math.floor(Date.now() / 1000) + 3600))
    fixture = TestBed.createComponent(TeamsAdminPage)
    http = TestBed.inject(HttpTestingController)
    root = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
    http.expectOne(adminTeamsPath).flush([home, away, town])
    await fixture.whenStable()
  })

  afterEach(() => {
    http.verify()
    TestBed.resetTestingModule()
  })

  it('does not POST when the create form is empty and shows field messages', async () => {
    ;(fixture.componentInstance as unknown as { loadForm(): void }).loadForm()
    fixture.detectChanges()
    ;[...root.querySelectorAll('button')]
      .find((node) => node.textContent?.includes('Save'))
      ?.click()
    http.expectNone(adminTeamsPath)
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain(MSG_TEAM_ID)
    expect(root.textContent).toContain(MSG_TEAM_SLUG)
    expect(root.textContent).toContain(MSG_TEAM_NAME)
    expect(root.textContent).toContain(MSG_TEAM_SHORT_NAME)
    expect(root.textContent).toContain(MSG_TEAM_COUNTRY)
    expect(document.activeElement?.id).toBe('team-id')
  })

  it('shows the API message when save returns 400', async () => {
    ;(fixture.componentInstance as unknown as { loadForm(row: Team): void }).loadForm(home)
    fixture.detectChanges()
    ;[...root.querySelectorAll('button')]
      .find((node) => node.textContent?.includes('Save'))
      ?.click()
    http
      .expectOne(adminTeamPath(home.id))
      .flush({ message: 'Slug taken', statusCode: 400 }, { status: 400, statusText: 'Bad Request' })
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain('Slug taken')
  })

  it('lists seeded clubs and creates a row with a football sport id', async () => {
    expect(root.textContent).toContain('Sample Home')
    expect(root.textContent).toContain('Sample Away')
    expect(root.textContent).toContain('Sample Town')
    expect(root.querySelector('a[href="/teams/"]')).toBeNull()
    expect(root.querySelector('a[href*="/club"]')).toBeNull()
    setModel(fixture, north)
    fixture.detectChanges()
    ;[...root.querySelectorAll('button')]
      .find((node) => node.textContent?.includes('Save'))
      ?.click()
    const create = http.expectOne(adminTeamsPath)
    expect(teamSchema.safeParse(create.request.body).success).toBe(true)
    expect(create.request.body).toMatchObject({ sportId: 'sport-football' })
    create.flush(north)
    http.expectOne(adminTeamsPath).flush([home, away, town, north])
    await fixture.whenStable()
    expect(root.textContent).toContain('Sample North')
  })

  it('never posts a tennis sport id even when the model holds one', async () => {
    setModel(fixture, { ...north, sportId: 'sport-tennis' })
    fixture.detectChanges()
    ;[...root.querySelectorAll('button')]
      .find((node) => node.textContent?.includes('Save'))
      ?.click()
    const create = http.expectOne(adminTeamsPath)
    expect(create.request.body).toMatchObject({ sportId: 'sport-football' })
    create.flush(north)
    http.expectOne(adminTeamsPath).flush([home, away, town, north])
    await fixture.whenStable()
  })

  it('keeps an in-use club when delete returns 409', async () => {
    ;[...root.querySelectorAll('button')]
      .find((node) => node.textContent?.includes('Delete'))
      ?.click()
    http
      .expectOne(adminTeamPath(home.id))
      .flush(
        { message: 'Team is in use', statusCode: 409 },
        { status: 409, statusText: 'Conflict' },
      )
    await fixture.whenStable()
    expect(root.textContent).toContain('Team is in use')
    expect(root.textContent).toContain('Sample Home')
  })
})

describe('TeamsAdminPage access', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify()
    TestBed.resetTestingModule()
  })

  it('keeps editors out of the teams admin route', async () => {
    await TestBed.configureTestingModule({
      imports: [TeamsAdminPage],
      providers: [
        provideRouter([
          { path: '', component: HomeProbe, canActivate: [editorGuard] },
          {
            path: 'admin/teams',
            component: TeamsAdminPage,
            canActivate: [adminGuard],
          },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(bearer('editor', Math.floor(Date.now() / 1000) + 3600))
    const router = TestBed.inject(Router)
    await router.navigateByUrl('/admin/teams')
    expect(router.url).toBe('/?admin=1')
  })
})
