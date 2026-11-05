import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { competitionSchema, type Competition } from '@cro-sport-hub/shared-types'
import { expect } from 'vite-plus/test'
import { adminGuard, authInterceptor, TOKEN_STORE, type TokenStore } from '../../core/auth'
import { adminCompetitionPath, adminCompetitionsPath } from '../../core/competitions-admin-api'
import { sportsPath } from '../../core/catalog-api'
import { stubSports } from '../../core/stub-api'
import { CompetitionsAdminPage } from './competitions-admin'

const cup: Competition = {
  id: 'comp-sample-cup',
  sportId: 'sport-tennis',
  name: 'Sample Cup',
  season: '2026',
  level: 'international',
}
const league: Competition = {
  id: 'comp-sample-league',
  sportId: 'sport-football',
  name: 'Sample League',
  season: '2026/27',
  level: 'domestic',
}
const harbor: Competition = {
  id: 'comp-harbor-open',
  sportId: 'sport-tennis',
  name: 'Harbor Open',
  season: '2026',
  level: 'international',
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
  const payload = btoa(JSON.stringify({ sub: 'admin-demo', role: 'admin', exp }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

function setModel(fixture: ComponentFixture<CompetitionsAdminPage>, row: Competition): void {
  ;(
    fixture.componentInstance as unknown as {
      model: { set(value: unknown): void }
    }
  ).model.set({
    id: row.id,
    sportId: row.sportId,
    name: row.name,
    season: row.season,
    level: row.level,
  })
}

describe('CompetitionsAdminPage', () => {
  let fixture: ComponentFixture<CompetitionsAdminPage>
  let http: HttpTestingController
  let root: HTMLElement

  beforeEach(async () => {
    globalThis.confirm = () => true
    await TestBed.configureTestingModule({
      imports: [CompetitionsAdminPage],
      providers: [
        provideRouter([
          {
            path: 'admin/competitions',
            component: CompetitionsAdminPage,
            canActivate: [adminGuard],
          },
        ]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore() },
      ],
    }).compileComponents()
    TestBed.inject(TOKEN_STORE).write(bearer(Math.floor(Date.now() / 1000) + 3600))
    fixture = TestBed.createComponent(CompetitionsAdminPage)
    http = TestBed.inject(HttpTestingController)
    root = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
    http.expectOne(sportsPath).flush(stubSports)
    http.expectOne(adminCompetitionsPath).flush([cup, league])
    await fixture.whenStable()
  })

  afterEach(() => {
    http.verify()
    TestBed.resetTestingModule()
  })

  it('lists seeded competitions and creates a row', async () => {
    expect(root.textContent).toContain('Sample Cup')
    expect(root.textContent).toContain('Sample League')
    setModel(fixture, harbor)
    fixture.detectChanges()
    ;[...root.querySelectorAll('button')]
      .find((node) => node.textContent?.includes('Save'))
      ?.click()
    const create = http.expectOne(adminCompetitionsPath)
    expect(competitionSchema.safeParse(create.request.body).success).toBe(true)
    create.flush(harbor)
    http.expectOne(adminCompetitionsPath).flush([cup, league, harbor])
    await fixture.whenStable()
    expect(root.textContent).toContain('Harbor Open')
  })

  it('keeps an in-use competition when delete returns 409', async () => {
    ;[...root.querySelectorAll('button')]
      .find((node) => node.textContent?.includes('Delete'))
      ?.click()
    http
      .expectOne(adminCompetitionPath(cup.id))
      .flush(
        { message: 'Competition is in use', statusCode: 409 },
        { status: 409, statusText: 'Conflict' },
      )
    await fixture.whenStable()
    expect(root.textContent).toContain('Competition is in use')
    expect(root.textContent).toContain('Sample Cup')
  })
})
