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

  it('shows Matches and New gallery for an editor, not Admin', async () => {
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
    expect(root.textContent).toContain('Home')
    const adminLinks = root.querySelectorAll('a[href="/admin/competitions"]')
    expect(adminLinks.length).toBe(0)
    const matchesLinks = root.querySelectorAll('a[href="/matches"]')
    expect(matchesLinks.length).toBeGreaterThanOrEqual(1)
    expect(root.querySelector('a[href="/galleries/new"]')).toBeInstanceOf(HTMLAnchorElement)
  })

  it('shows Admin links for an admin', async () => {
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
    expect(root.querySelectorAll('a[href="/admin/competitions"]').length).toBe(2)
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
      'Admin pages need an admin login.',
    )
  })
})
