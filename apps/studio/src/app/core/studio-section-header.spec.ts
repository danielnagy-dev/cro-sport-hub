import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import { TOKEN_STORE, type TokenStore } from './auth'
import { StudioSectionHeader } from './studio-section-header'

function bearer(): string {
  const payload = btoa(
    JSON.stringify({
      sub: 'admin-demo',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
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

describe('StudioSectionHeader', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioSectionHeader],
      providers: [
        provideRouter([
          { path: 'pocetna', component: StudioSectionHeader },
          { path: 'sportasi', component: StudioSectionHeader },
        ]),
        { provide: TOKEN_STORE, useValue: memoryStore(bearer()) },
      ],
    }).compileComponents()
  })

  it('shows exactly the four Croatian section links', async () => {
    const fixture = TestBed.createComponent(StudioSectionHeader)
    fixture.detectChanges()
    await fixture.whenStable()
    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('nav.shell-nav a')]
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Početna',
      'Sportaši',
      'Objave',
      'Postavke',
    ])
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/pocetna',
      '/sportasi',
      '/objave',
      '/postavke',
    ])
    expect(links.some((link) => link.getAttribute('href') === '/matches')).toBe(false)
  })

  it('marks the active section from the URL', async () => {
    const fixture = TestBed.createComponent(StudioSectionHeader)
    await TestBed.inject(Router).navigateByUrl('/sportasi')
    fixture.detectChanges()
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement
    expect(root.querySelector('a[href="/sportasi"]')?.getAttribute('aria-current')).toBe('page')
  })
})
