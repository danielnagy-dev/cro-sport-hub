import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { firstValueFrom } from 'rxjs'
import { expect } from 'vite-plus/test'
import {
  AppearancesApi,
  appearancesPath,
  sampleAppearance,
  sampleNationalTeamAppearance,
} from './appearances-api'

describe('AppearancesApi', () => {
  let api: AppearancesApi
  let http: HttpTestingController
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
    api = TestBed.inject(AppearancesApi)
    http = TestBed.inject(HttpTestingController)
  })
  afterEach(() => http.verify())

  it('lists by day and optional sport; rejects bad rows', async () => {
    const listed = firstValueFrom(api.list({ day: '2026-11-22' }))
    http
      .expectOne(`${appearancesPath}?day=2026-11-22`)
      .flush([sampleAppearance, sampleNationalTeamAppearance])
    await expect(listed).resolves.toEqual([sampleAppearance, sampleNationalTeamAppearance])

    const filtered = firstValueFrom(api.list({ day: '2026-11-22', sportSlug: 'tennis' }))
    http.expectOne(`${appearancesPath}?day=2026-11-22&sportSlug=tennis`).flush([sampleAppearance])
    await expect(filtered).resolves.toEqual([sampleAppearance])

    const bad = firstValueFrom(api.list({ day: '2026-11-22' }))
    http.expectOne(`${appearancesPath}?day=2026-11-22`).flush([{ id: 'bad' }])
    await expect(bad).rejects.toThrow(/Invalid appearance/)
  })
})
