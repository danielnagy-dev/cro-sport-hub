import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap } from '@angular/router'
import { of } from 'rxjs'
import { expect } from 'vite-plus/test'
import { appConfig } from './app.config'
import { TOKEN_STORE, type TokenStore } from './core/auth'
import { Shell } from './feature/editor/shell'

const HOUR = 60 * 60

function bearer(role: 'editor' | 'admin', exp: number, sub?: string): string {
  const id = sub ?? `${role}-demo`
  const payload = btoa(JSON.stringify({ sub: id, role, exp }))
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

describe('Shell home', () => {
  beforeEach(() => {
    TestBed.resetTestingModule()
    sessionStorage.clear()
  })

  it('shows the header nav and no old match/gallery/admin shortcuts', async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        ...appConfig.providers,
        {
          provide: TOKEN_STORE,
          useValue: memoryStore(bearer('editor', Math.floor(Date.now() / 1000) + HOUR)),
        },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    }).compileComponents()

    const fixture = TestBed.createComponent(Shell)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement

    expect(root.querySelector('h1')?.textContent).toContain('Studio')
    expect(root.textContent).toContain('Cro Sport Hub')
    expect(root.querySelector('h2')?.textContent?.trim()).toBe('Početna')
    expect(root.textContent).toContain('Odaberite odjeljak u navigaciji iznad.')
    const navLabels = [...root.querySelectorAll('nav.shell-nav a')].map((el) =>
      el.textContent?.trim(),
    )
    expect(navLabels).toEqual(['Početna', 'Sportaši', 'Objave', 'Postavke'])
    expect(root.querySelector('main a[href="/matches"]')).toBeNull()
    expect(root.querySelector('main a[href="/galleries/new"]')).toBeNull()
    expect(root.querySelector('main a[href="/admin/competitions"]')).toBeNull()
    expect(root.querySelector('nav.shell-nav a[href="/matches"]')).toBeNull()
    expect(root.querySelector('nav.shell-nav a[href="/admin/competitions"]')).toBeNull()
  })

  it('keeps admin-only home free of Admin shortcuts', async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        ...appConfig.providers,
        {
          provide: TOKEN_STORE,
          useValue: memoryStore(bearer('admin', Math.floor(Date.now() / 1000) + HOUR)),
        },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    }).compileComponents()

    const fixture = TestBed.createComponent(Shell)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement
    expect(root.querySelectorAll('main a[href="/admin/competitions"]').length).toBe(0)
    expect(root.querySelectorAll('nav.shell-nav a[href="/admin/competitions"]').length).toBe(0)
  })

  it('shows the admin-only message after an editor hits admin routes', async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        ...appConfig.providers,
        {
          provide: TOKEN_STORE,
          useValue: memoryStore(bearer('editor', Math.floor(Date.now() / 1000) + HOUR)),
        },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({ admin: '1' })) },
        },
      ],
    }).compileComponents()

    const fixture = TestBed.createComponent(Shell)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement
    expect(root.querySelector('.home-admin-only')?.textContent).toContain(
      'Admin stranice zahtijevaju admin prijavu.',
    )
  })
})
