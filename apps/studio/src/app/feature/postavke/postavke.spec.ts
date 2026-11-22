import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { expect } from 'vite-plus/test'
import { authInterceptor, TOKEN_STORE, type TokenStore } from '../../core/auth'
import { t } from '../../core/messages'
import {
  connectedAccountsPath,
  publishSlotClocksPath,
  type ConnectedAccount,
  type PublishSlotClock,
} from '../../core/settings-api'
import { PostavkePage } from './postavke'

const CLOCKS: PublishSlotClock[] = [
  { id: 'slot-clock-1530', label: '15:30', clockTime: '15:30', sortOrder: 1, active: true },
  { id: 'slot-clock-2200', label: '22:00', clockTime: '22:00', sortOrder: 2, active: true },
]
const ACCOUNTS: ConnectedAccount[] = [
  { network: 'instagram', loginChecked: false },
  { network: 'facebook', loginChecked: false },
  { network: 'x', loginChecked: false },
]

describe('PostavkePage', () => {
  let http: HttpTestingController

  beforeEach(async () => {
    const payload = btoa(
      JSON.stringify({
        sub: 'editor-demo',
        role: 'editor',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    )
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '')
    let token: string | null = `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
    const store: TokenStore = {
      read: () => token,
      write: (next) => {
        token = next
      },
      clear: () => {
        token = null
      },
    }
    await TestBed.configureTestingModule({
      imports: [PostavkePage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: store },
      ],
    }).compileComponents()
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('loads stubs and saves an edited clock time', async () => {
    const fixture = TestBed.createComponent(PostavkePage)
    fixture.detectChanges()
    http.expectOne(publishSlotClocksPath).flush(CLOCKS)
    http.expectOne(connectedAccountsPath).flush(ACCOUNTS)
    await fixture.whenStable()
    fixture.detectChanges()
    const root = fixture.nativeElement as HTMLElement
    expect(root.querySelector('h2')?.textContent?.trim()).toBe(t('postavke.title'))
    expect(root.textContent).toContain(t('postavke.network.instagram'))
    const input = root.querySelector('#clock-time-slot-clock-1530') as HTMLInputElement
    input.value = '16:45'
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    ;(root.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'))
    fixture.detectChanges()
    const morning = CLOCKS[0]
    const evening = CLOCKS[1]
    const patch = http.expectOne(publishSlotClocksPath)
    expect(patch.request.body).toEqual({ clocks: [{ ...morning, clockTime: '16:45' }, evening] })
    patch.flush([{ ...morning, clockTime: '16:45' }, evening])
    await fixture.whenStable()
    fixture.detectChanges()
    expect(root.textContent).toContain(t('postavke.save-success'))
  })
})
