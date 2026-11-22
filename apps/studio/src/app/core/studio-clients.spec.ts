import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { expect } from 'vite-plus/test'
import { firstValueFrom } from 'rxjs'
import { CatalogApi, sportsPath } from './catalog-api'
import { editorAthletesPath, editorCompetitionsPath, EditorLookupsApi } from './editor-lookups-api'
import { stubApiInterceptor, stubSports } from './stub-api'

describe('studio clients', () => {
  let catalog: CatalogApi
  let lookups: EditorLookupsApi
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    catalog = TestBed.inject(CatalogApi)
    lookups = TestBed.inject(EditorLookupsApi)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    http.verify()
  })

  it('parses sports', async () => {
    const sports = firstValueFrom(catalog.sports())
    http.expectOne(sportsPath).flush(stubSports)

    await expect(sports).resolves.toEqual(stubSports)
  })

  it('rejects a sports list that fails the schema', async () => {
    const sports = firstValueFrom(catalog.sports())
    http.expectOne(sportsPath).flush([{ id: 'bad' }])

    await expect(sports).rejects.toThrow(
      '[\n  {\n    "code": "invalid_value",\n    "values": [\n      "tennis",\n      "football",\n      "basketball"\n    ],\n    "path": [\n      0,\n      "slug"\n    ],\n    "message": "Invalid option: expected one of \\"tennis\\"|\\"football\\"|\\"basketball\\""\n  },\n  {\n    "expected": "string",\n    "code": "invalid_type",\n    "path": [\n      0,\n      "name"\n    ],\n    "message": "Invalid input: expected string, received undefined"\n  }\n]',
    )
  })

  it('parses editor lookups', async () => {
    const competitions = firstValueFrom(lookups.editorCompetitions('tennis'))
    const athletes = firstValueFrom(lookups.editorAthletes('tennis'))
    http
      .expectOne(`${editorCompetitionsPath}?sport=tennis`)
      .flush([{ id: 'comp-sample-cup', name: 'Sample Cup', season: '2026' }])
    http
      .expectOne(`${editorAthletesPath}?sport=tennis`)
      .flush([{ id: 'sample-player-a', name: 'Sample Player A' }])
    await expect(competitions).resolves.toEqual([
      { id: 'comp-sample-cup', name: 'Sample Cup', season: '2026' },
    ])
    await expect(athletes).resolves.toEqual([{ id: 'sample-player-a', name: 'Sample Player A' }])
  })
})

describe('stubApiInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([stubApiInterceptor])),
        provideHttpClientTesting(),
      ],
    })
  })

  it('answers the sports read endpoint with the stub', async () => {
    const catalog = TestBed.inject(CatalogApi)

    await expect(firstValueFrom(catalog.sports())).resolves.toEqual(stubSports)
  })

  it('leaves every other request for the backend', () => {
    const http = TestBed.inject(HttpTestingController)
    const client = TestBed.inject(HttpClient)
    client.get('/api/other').subscribe()

    http.expectOne('/api/other')
    http.verify()
  })
})
