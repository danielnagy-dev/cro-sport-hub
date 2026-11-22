import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { firstValueFrom } from 'rxjs'
import { expect } from 'vite-plus/test'
import {
  connectedAccountsPath,
  publishSlotClocksPath,
  SettingsApi,
  type ConnectedAccount,
  type PublishSlotClock,
} from './settings-api'

const CLOCKS: PublishSlotClock[] = [
  { id: 'slot-clock-1530', label: '15:30', clockTime: '15:30', sortOrder: 1, active: true },
  { id: 'slot-clock-2200', label: '22:00', clockTime: '22:00', sortOrder: 2, active: true },
]

const ACCOUNTS: ConnectedAccount[] = [{ network: 'instagram', loginChecked: false }]

describe('SettingsApi', () => {
  let api: SettingsApi
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    api = TestBed.inject(SettingsApi)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('loads and saves clocks and lists account stubs', async () => {
    const listed = firstValueFrom(api.listPublishSlotClocks())
    http.expectOne(publishSlotClocksPath).flush(CLOCKS)
    await expect(listed).resolves.toEqual(CLOCKS)

    const morning = CLOCKS[0]
    const evening = CLOCKS[1]
    const patched = [
      { ...morning, clockTime: '16:00' },
      { ...evening, clockTime: '21:30' },
    ]
    const saved = firstValueFrom(api.updatePublishSlotClocks({ clocks: patched }))
    const request = http.expectOne(publishSlotClocksPath)
    expect(request.request.method).toBe('PATCH')
    expect(request.request.body).toEqual({ clocks: patched })
    request.flush(patched)
    await expect(saved).resolves.toEqual(patched)

    const accounts = firstValueFrom(api.listConnectedAccounts())
    http.expectOne(connectedAccountsPath).flush(ACCOUNTS)
    await expect(accounts).resolves.toEqual(ACCOUNTS)
  })

  it('rejects invalid clocks and accounts payloads', async () => {
    const badClocks = firstValueFrom(api.listPublishSlotClocks())
    http.expectOne(publishSlotClocksPath).flush([{ id: 'bad' }])
    await expect(badClocks).rejects.toThrow('Invalid publish slot clock')

    const badAccounts = firstValueFrom(api.listConnectedAccounts())
    http.expectOne(connectedAccountsPath).flush([{ network: 'tiktok', loginChecked: false }])
    await expect(badAccounts).rejects.toThrow('Invalid connected account')
  })
})
