import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { type Type } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router'
import { of } from 'rxjs'
import { expect } from 'vite-plus/test'
import { appConfig } from '../app.config'
import { appearancesPath, sampleAppearance } from '../core/appearances-api'
import { authInterceptor, TOKEN_STORE, type TokenStore } from '../core/auth'
import { t } from '../core/messages'
import {
  publishSlotsNextPath,
  publishSlotsPath,
  samplePublishSlot,
} from '../core/publish-slots-api'
import { startOfLocalDay } from './editorial-day'
import { ObjavePage } from './objave/objave'
import { editorialDayIso, PocetnaPage } from './pocetna/pocetna'

const HOUR = 60 * 60

function bearer(role: 'editor' | 'admin' = 'editor'): string {
  const payload = btoa(
    JSON.stringify({ sub: `${role}-demo`, role, exp: Math.floor(Date.now() / 1000) + HOUR }),
  )
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`
}

function memoryStore(token: string | null): TokenStore {
  let value = token
  return {
    read: () => value,
    write: (next) => {
      value = next
    },
    clear: () => {
      value = null
    },
  }
}

describe('editorial stubs', () => {
  beforeEach(() => {
    TestBed.resetTestingModule()
    sessionStorage.clear()
  })

  it.each([[ObjavePage as Type<unknown>, t('objave.title'), t('objave.lead')]] as const)(
    'renders %s',
    async (Page, heading, copy) => {
      await TestBed.configureTestingModule({
        imports: [Page],
        providers: [
          ...appConfig.providers,
          { provide: TOKEN_STORE, useValue: memoryStore(bearer()) },
        ],
      }).compileComponents()
      const fixture = TestBed.createComponent(Page)
      await fixture.whenStable()
      const root = fixture.nativeElement as HTMLElement
      expect(root.querySelector('h2')?.textContent?.trim()).toBe(heading)
      expect(root.textContent).toContain(copy)
    },
  )

  it('renders Početna and the admin-only message', async () => {
    await TestBed.configureTestingModule({
      imports: [PocetnaPage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore(bearer()) },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({ admin: '1' })) },
        },
      ],
    }).compileComponents()
    const http = TestBed.inject(HttpTestingController)
    const fixture = TestBed.createComponent(PocetnaPage)
    fixture.detectChanges()
    const day = editorialDayIso(startOfLocalDay())
    const planned = { ...samplePublishSlot, status: 'planned' as const }
    http.expectOne(publishSlotsNextPath).flush(planned)
    http.expectOne(`${publishSlotsPath}?day=${day}`).flush([planned])
    http.expectOne(`${appearancesPath}?day=${day}&sportSlug=tennis`).flush([sampleAppearance])
    await fixture.whenStable()
    fixture.detectChanges()
    const root = fixture.nativeElement as HTMLElement
    expect(root.querySelector('h2')?.textContent?.trim()).toBe(t('pocetna.title'))
    expect(root.querySelector('.home-admin-only')?.textContent).toContain(t('pocetna.admin-only'))
    http.verify()
  })
})
