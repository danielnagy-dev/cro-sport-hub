import { TestBed } from '@angular/core/testing'
import { expect } from 'vite-plus/test'
import { appConfig } from '../../app.config'
import { TOKEN_STORE, type TokenStore } from '../../core/auth'
import { ObjavePage } from './objave'

const HOUR = 60 * 60

function bearer(): string {
  const payload = btoa(
    JSON.stringify({
      sub: 'editor-demo',
      role: 'editor',
      exp: Math.floor(Date.now() / 1000) + HOUR,
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

describe('ObjavePage FilterBar', () => {
  beforeEach(() => {
    TestBed.resetTestingModule()
    sessionStorage.clear()
  })

  it('renders the FilterBar host and updates the day label', async () => {
    await TestBed.configureTestingModule({
      imports: [ObjavePage],
      providers: [
        ...appConfig.providers,
        { provide: TOKEN_STORE, useValue: memoryStore(bearer()) },
      ],
    }).compileComponents()
    const fixture = TestBed.createComponent(ObjavePage)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement

    expect(root.querySelector('csh-ui-filter-bar')).not.toBeNull()
    const label = () => root.querySelector('.csh-filter-bar__day-label')?.textContent?.trim() ?? ''
    const initial = label()
    expect(initial.length).toBeGreaterThan(0)

    const previous = root.querySelector('button[aria-label="Previous day"]')
    if (!(previous instanceof HTMLButtonElement)) throw new Error('missing previous day')
    previous.click()
    fixture.detectChanges()
    expect(label()).not.toBe(initial)

    const next = root.querySelector('button[aria-label="Next day"]')
    if (!(next instanceof HTMLButtonElement)) throw new Error('missing next day')
    next.click()
    fixture.detectChanges()
    expect(label()).toBe(initial)
  })
})
