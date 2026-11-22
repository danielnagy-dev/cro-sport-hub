import { type Type } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap } from '@angular/router'
import { of } from 'rxjs'
import { expect } from 'vite-plus/test'
import { appConfig } from '../app.config'
import { TOKEN_STORE, type TokenStore } from '../core/auth'
import { t } from '../core/messages'
import { ObjavePage } from './objave/objave'
import { PocetnaPage } from './pocetna/pocetna'
import { PostavkePage } from './postavke/postavke'
import { SportasiPage } from './sportasi/sportasi'

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

  it.each([
    [SportasiPage as Type<unknown>, t('sportasi.title'), t('sportasi.lead')],
    [ObjavePage as Type<unknown>, t('objave.title'), t('objave.lead')],
    [PostavkePage as Type<unknown>, t('postavke.title'), t('postavke.lead')],
  ] as const)('renders %s', async (Page, heading, copy) => {
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
  })

  it('renders Početna and the admin-only message', async () => {
    await TestBed.configureTestingModule({
      imports: [PocetnaPage],
      providers: [
        ...appConfig.providers,
        { provide: TOKEN_STORE, useValue: memoryStore(bearer()) },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({ admin: '1' })) },
        },
      ],
    }).compileComponents()
    const fixture = TestBed.createComponent(PocetnaPage)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement
    expect(root.querySelector('h2')?.textContent?.trim()).toBe(t('pocetna.title'))
    expect(root.querySelector('.home-admin-only')?.textContent).toContain(t('pocetna.admin-only'))
  })
})
