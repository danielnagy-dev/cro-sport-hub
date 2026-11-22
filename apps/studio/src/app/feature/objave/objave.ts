import { Component, computed, inject, OnDestroy, signal } from '@angular/core'
import type { PublishSlotStatus } from '@cro-sport-hub/shared-types'
import { catchError, forkJoin, map, of, type Subscription } from 'rxjs'
import { t } from '../../core/messages'
import { PublishSlotsApi, type PublishSlot } from '../../core/publish-slots-api'
import { StudioSectionHeader } from '../../core/studio-section-header'
import { PublishSlotDrawer } from '../../layout/publish-slot-drawer/publish-slot-drawer'
import { CshUiFilterBar } from '../../layout/ui-kit/filter-bar'
import type { KitStatus, KitTone } from '../../layout/ui-kit/kit-variants'
import { CshUiStatusPill } from '../../layout/ui-kit/status-pill'
import { editorialDayLabel, shiftEditorialDay, startOfLocalDay } from '../editorial-day'

type LoadStatus = 'loading' | 'ready' | 'error'
type StatusFilter = 'all' | PublishSlotStatus

const SLOT_STATUSES = [
  'planned',
  'waiting_for_data',
  'ready_for_review',
  'approved',
  'published',
  'skipped',
  'error',
] as const satisfies readonly PublishSlotStatus[]

const GLANCE_ORDER = [
  'error',
  'ready_for_review',
  'waiting_for_data',
  'planned',
  'approved',
  'published',
  'skipped',
] as const satisfies readonly PublishSlotStatus[]

function toIsoDay(day: Date): string {
  const month = String(day.getMonth() + 1).padStart(2, '0')
  const date = String(day.getDate()).padStart(2, '0')
  return `${day.getFullYear()}-${month}-${date}`
}

function weekDays(day: Date): Date[] {
  const start = startOfLocalDay(day)
  const mondayOffset = (start.getDay() + 6) % 7
  const monday = shiftEditorialDay(start, -mondayOffset)
  return Array.from({ length: 7 }, (_, index) => shiftEditorialDay(monday, index))
}

function kitFor(status: PublishSlotStatus): KitStatus {
  if (status === 'published' || status === 'approved') return 'published'
  return status === 'ready_for_review' ? 'review' : 'draft'
}

function glanceOf(slots: PublishSlot[]): PublishSlotStatus | null {
  for (const status of GLANCE_ORDER) {
    if (slots.some((slot) => slot.status === status)) return status
  }
  return null
}

@Component({
  selector: 'app-objave',
  imports: [StudioSectionHeader, CshUiFilterBar, CshUiStatusPill, PublishSlotDrawer],
  templateUrl: './objave.html',
})
export class ObjavePage implements OnDestroy {
  private readonly api = inject(PublishSlotsApi)
  private pending: Subscription | undefined
  private weekKey = ''

  protected readonly copy = {
    skip: t('objave.skip'),
    title: t('objave.title'),
    lead: t('objave.lead'),
    loading: t('objave.loading'),
    loadError: t('objave.load-error'),
    empty: t('objave.empty'),
    statusFilter: t('objave.status-filter'),
    statusAll: t('objave.status-all'),
    calendar: t('objave.calendar'),
    list: t('objave.list'),
    colTime: t('objave.col-time'),
    colStatus: t('objave.col-status'),
    colSlides: t('objave.col-slides'),
    open: t('objave.open'),
  }
  protected readonly statuses = SLOT_STATUSES
  protected readonly day = signal(startOfLocalDay())
  protected readonly dayLabel = computed(() => editorialDayLabel(this.day()))
  protected readonly sport: KitTone = 'tennis'
  protected readonly athlete = 'Svi sportaši'
  protected readonly statusFilter = signal<StatusFilter>('all')
  protected readonly filterBarStatus = computed<KitStatus>(() => {
    const filter = this.statusFilter()
    return filter === 'all' ? 'draft' : kitFor(filter)
  })
  protected readonly loadStatus = signal<LoadStatus>('loading')
  protected readonly slotsByDay = signal<ReadonlyMap<string, PublishSlot[]>>(new Map())
  protected readonly drawerOpen = signal(false)
  protected readonly selectedSlot = signal<PublishSlot | null>(null)

  protected readonly slots = computed(() => {
    const rows = this.slotsByDay().get(toIsoDay(this.day())) ?? []
    const filter = this.statusFilter()
    return filter === 'all' ? rows : rows.filter((slot) => slot.status === filter)
  })

  protected readonly weekChips = computed(() => {
    const selected = toIsoDay(this.day())
    const map = this.slotsByDay()
    return weekDays(this.day()).map((day) => {
      const iso = toIsoDay(day)
      const glance = glanceOf(map.get(iso) ?? [])
      return {
        iso,
        label: String(day.getDate()),
        selected: iso === selected,
        glance,
        kit: glance === null ? null : kitFor(glance),
      }
    })
  })

  constructor() {
    this.reload()
  }

  ngOnDestroy(): void {
    this.pending?.unsubscribe()
  }

  protected kitStatus(status: PublishSlotStatus): KitStatus {
    return kitFor(status)
  }

  protected onPreviousDay(): void {
    this.day.update((current) => shiftEditorialDay(current, -1))
    this.reload()
  }

  protected onNextDay(): void {
    this.day.update((current) => shiftEditorialDay(current, 1))
    this.reload()
  }

  protected onStatusFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value
    this.statusFilter.set(value === 'all' ? 'all' : (value as PublishSlotStatus))
  }

  protected selectDay(iso: string): void {
    const [year, month, date] = iso.split('-').map(Number)
    if (year === undefined || month === undefined || date === undefined) return
    this.day.set(new Date(year, month - 1, date))
    this.reload()
  }

  protected openSlot(slot: PublishSlot): void {
    this.selectedSlot.set(slot)
    this.drawerOpen.set(true)
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false)
  }

  protected onApproved(slot: PublishSlot): void {
    this.selectedSlot.set(slot)
    this.slotsByDay.update((map) => {
      const next = new Map(map)
      const rows = [...(next.get(slot.slotDate) ?? [])]
      const index = rows.findIndex((row) => row.id === slot.id)
      if (index >= 0) rows[index] = slot
      else rows.push(slot)
      next.set(slot.slotDate, rows)
      return next
    })
  }

  private reload(): void {
    const days = weekDays(this.day())
    const key = toIsoDay(days[0] ?? this.day())
    if (key === this.weekKey && this.loadStatus() === 'ready') return
    this.weekKey = key
    this.loadStatus.set('loading')
    this.pending?.unsubscribe()
    this.pending = forkJoin(
      days.map((day) => {
        const iso = toIsoDay(day)
        return this.api.listForDay(iso).pipe(
          map((slots) => [iso, slots] as const),
          catchError(() => of([iso, [] as PublishSlot[]] as const)),
        )
      }),
    ).subscribe({
      next: (rows) => {
        this.slotsByDay.set(new Map(rows))
        this.loadStatus.set('ready')
      },
      error: () => this.loadStatus.set('error'),
    })
  }
}
