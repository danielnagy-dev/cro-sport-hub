import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { expect } from 'vite-plus/test'
import { authInterceptor, TOKEN_STORE, type TokenStore } from '../../core/auth'
import { t } from '../../core/messages'
import { publishSlotsPath, samplePublishSlot, type PublishSlot } from '../../core/publish-slots-api'
import { ObjavePage } from './objave'

function bearer(): string {
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

function todayIso(): string {
  const day = new Date()
  const month = String(day.getMonth() + 1).padStart(2, '0')
  const date = String(day.getDate()).padStart(2, '0')
  return `${day.getFullYear()}-${month}-${date}`
}

function flushWeek(
  http: HttpTestingController,
  slotsByDay: Record<string, PublishSlot[]> = {},
): string[] {
  const requests = http.match(
    (request) => request.method === 'GET' && request.url.startsWith(publishSlotsPath),
  )
  const days: string[] = []
  for (const request of requests) {
    const day = request.request.params.get('day') ?? ''
    days.push(day)
    request.flush(slotsByDay[day] ?? [])
  }
  return days
}

describe('ObjavePage', () => {
  let http: HttpTestingController

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjavePage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE, useValue: memoryStore(bearer()) },
      ],
    }).compileComponents()
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('loads the week, filters by status, and updates the day from chips', async () => {
    const selected = todayIso()
    const slot: PublishSlot = { ...samplePublishSlot, slotDate: selected }
    const fixture = TestBed.createComponent(ObjavePage)
    fixture.detectChanges()
    const days = flushWeek(http, { [selected]: [slot] })
    expect(days).toHaveLength(7)
    expect(days).toContain(selected)
    await fixture.whenStable()
    fixture.detectChanges()
    const root = fixture.nativeElement as HTMLElement

    expect(root.querySelector('csh-ui-filter-bar')).not.toBeNull()
    expect(root.querySelector('h2')?.textContent?.trim()).toBe(t('objave.title'))
    expect(root.textContent).toContain(slot.clockTime)

    const select = root.querySelector('select[aria-label="Status"]')
    if (!(select instanceof HTMLSelectElement)) throw new Error('missing status filter')
    select.value = 'published'
    select.dispatchEvent(new Event('change'))
    fixture.detectChanges()
    expect(root.textContent).toContain(t('objave.empty'))
    select.value = 'ready_for_review'
    select.dispatchEvent(new Event('change'))
    fixture.detectChanges()
    expect(root.textContent).toContain(slot.clockTime)

    const other = days.find((day) => day !== selected)
    if (other === undefined) throw new Error('missing other week day')
    const chip = root.querySelector(`button[aria-label^="${other}"]`)
    if (!(chip instanceof HTMLButtonElement)) throw new Error('missing week chip')
    chip.click()
    fixture.detectChanges()
    expect(http.match(() => true)).toHaveLength(0)
    expect(root.textContent).toContain(t('objave.empty'))
  })

  it('opens the shared drawer from a row without changing the route', async () => {
    const selected = todayIso()
    const slot: PublishSlot = { ...samplePublishSlot, slotDate: selected }
    const fixture = TestBed.createComponent(ObjavePage)
    const router = TestBed.inject(Router)
    const before = router.url
    fixture.detectChanges()
    flushWeek(http, { [selected]: [slot] })
    await fixture.whenStable()
    fixture.detectChanges()
    const root = fixture.nativeElement as HTMLElement

    const open = Array.from(root.querySelectorAll('button')).find((button) =>
      button.textContent?.includes(t('objave.open')),
    )
    if (!(open instanceof HTMLButtonElement)) throw new Error('missing open')
    open.click()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(router.url).toBe(before)
    expect(root.querySelector('.csh-drawer')?.getAttribute('role')).toBe('dialog')
    expect(root.textContent).toContain('Instagram')
  })

  it('keeps FilterBar day labels in sync across previous and next', async () => {
    const fixture = TestBed.createComponent(ObjavePage)
    fixture.detectChanges()
    flushWeek(http)
    await fixture.whenStable()
    fixture.detectChanges()
    const root = fixture.nativeElement as HTMLElement
    const label = () => root.querySelector('.csh-filter-bar__day-label')?.textContent?.trim() ?? ''
    const initial = label()
    expect(initial.length).toBeGreaterThan(0)

    const previous = root.querySelector('button[aria-label="Previous day"]')
    if (!(previous instanceof HTMLButtonElement)) throw new Error('missing previous day')
    previous.click()
    fixture.detectChanges()
    flushWeek(http)
    await fixture.whenStable()
    fixture.detectChanges()
    expect(label()).not.toBe(initial)

    const next = root.querySelector('button[aria-label="Next day"]')
    if (!(next instanceof HTMLButtonElement)) throw new Error('missing next day')
    next.click()
    fixture.detectChanges()
    flushWeek(http)
    await fixture.whenStable()
    fixture.detectChanges()
    expect(label()).toBe(initial)
  })
})
