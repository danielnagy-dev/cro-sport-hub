import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap } from '@angular/router'
import { of } from 'rxjs'
import { expect } from 'vite-plus/test'
import { appConfig } from '../../app.config'
import { TOKEN_STORE, type TokenStore } from '../../core/auth'
import { PocetnaPage } from './pocetna'

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

describe('PocetnaPage FilterBar', () => {
  beforeEach(() => {
    TestBed.resetTestingModule()
    sessionStorage.clear()
  })

  async function mount(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [PocetnaPage],
      providers: [
        ...appConfig.providers,
        { provide: TOKEN_STORE, useValue: memoryStore(bearer()) },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    }).compileComponents()
    const fixture = TestBed.createComponent(PocetnaPage)
    await fixture.whenStable()
    return fixture.nativeElement as HTMLElement
  }

  it('renders the FilterBar host and Pregledaj harness', async () => {
    const root = await mount()
    expect(root.querySelector('csh-ui-filter-bar')).not.toBeNull()
    expect(root.textContent).toContain('Pregledaj')
  })

  it('updates the day label from previous and next without HTTP', async () => {
    await TestBed.configureTestingModule({
      imports: [PocetnaPage],
      providers: [
        ...appConfig.providers,
        { provide: TOKEN_STORE, useValue: memoryStore(bearer()) },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    }).compileComponents()
    const fixture = TestBed.createComponent(PocetnaPage)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement
    const label = () => root.querySelector('.csh-filter-bar__day-label')?.textContent?.trim() ?? ''

    const initial = label()
    expect(initial.length).toBeGreaterThan(0)

    const previous = root.querySelector('button[aria-label="Previous day"]')
    if (!(previous instanceof HTMLButtonElement)) throw new Error('missing previous day')
    previous.click()
    fixture.detectChanges()
    const afterPrevious = label()
    expect(afterPrevious).not.toBe(initial)

    const next = root.querySelector('button[aria-label="Next day"]')
    if (!(next instanceof HTMLButtonElement)) throw new Error('missing next day')
    next.click()
    fixture.detectChanges()
    expect(label()).toBe(initial)

    next.click()
    fixture.detectChanges()
    expect(label()).not.toBe(initial)
    expect(label()).not.toBe(afterPrevious)
  })
})
