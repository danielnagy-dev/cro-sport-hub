import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import type { Network, PublishSlotStatus, SportSlug } from '@cro-sport-hub/shared-types'
import { catchError, forkJoin, map, of, type Subscription } from 'rxjs'
import { AppearancesApi, type EditorAppearance } from '../../core/appearances-api'
import { t } from '../../core/messages'
import { PublishSlotsApi, type PublishSlot } from '../../core/publish-slots-api'
import { StudioSectionHeader } from '../../core/studio-section-header'
import { PublishSlotDrawer } from '../../layout/publish-slot-drawer/publish-slot-drawer'
import { CshUiButton } from '../../layout/ui-kit/button'
import { CshUiFilterBar } from '../../layout/ui-kit/filter-bar'
import type { KitStatus, KitTone } from '../../layout/ui-kit/kit-variants'
import { CshUiStatusPill } from '../../layout/ui-kit/status-pill'
import { editorialDayLabel, shiftEditorialDay, startOfLocalDay } from '../editorial-day'

const NETWORKS = ['instagram', 'facebook', 'x'] as const satisfies readonly Network[]
const STATUS_FILTER: Record<KitStatus, readonly PublishSlotStatus[]> = {
  draft: ['planned', 'waiting_for_data'],
  review: ['ready_for_review'],
  published: ['approved', 'published'],
}

export function editorialDayIso(day: Date): string {
  const m = String(day.getMonth() + 1).padStart(2, '0')
  const d = String(day.getDate()).padStart(2, '0')
  return `${day.getFullYear()}-${m}-${d}`
}

function asSport(tone: KitTone): SportSlug {
  return tone === 'neutral' ? 'tennis' : tone
}

function asKit(status: string): KitStatus {
  if (status === 'published' || status === 'approved') return 'published'
  return status === 'ready_for_review' ? 'review' : 'draft'
}

@Component({
  selector: 'app-pocetna',
  imports: [StudioSectionHeader, CshUiFilterBar, CshUiButton, CshUiStatusPill, PublishSlotDrawer],
  templateUrl: './pocetna.html',
})
export class PocetnaPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute)
  private readonly slotsApi = inject(PublishSlotsApi)
  private readonly appearancesApi = inject(AppearancesApi)
  private pending: Subscription | undefined

  protected readonly copy = {
    title: t('pocetna.title'),
    adminOnly: t('pocetna.admin-only'),
    next: t('pocetna.next-slot'),
    athletes: t('pocetna.athletes-heading'),
    posts: t('pocetna.posts-heading'),
    preview: t('publish-drawer.preview'),
    approve: t('publish-drawer.approve'),
    slides: t('pocetna.slides'),
    emptyNext: t('pocetna.empty-next'),
    emptyList: t('pocetna.empty-list'),
    loadError: t('pocetna.load-error'),
  }
  protected readonly networks = NETWORKS
  protected readonly showAdminOnlyMessage = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('admin') === '1')),
    { initialValue: false },
  )
  protected readonly day = signal(startOfLocalDay())
  protected readonly dayLabel = computed(() => editorialDayLabel(this.day()))
  protected readonly dayIso = computed(() => editorialDayIso(this.day()))
  protected readonly sport = signal<KitTone>('tennis')
  protected readonly athlete = 'Svi sportaši'
  protected readonly status = signal<KitStatus>('draft')
  protected readonly nextSlot = signal<PublishSlot | null>(null)
  protected readonly appearances = signal<EditorAppearance[]>([])
  protected readonly posts = signal<PublishSlot[]>([])
  protected readonly loadError = signal<string | null>(null)
  protected readonly busy = signal(false)
  protected readonly drawerOpen = signal(false)
  protected readonly selectedSlot = signal<PublishSlot | null>(null)
  protected readonly visiblePosts = computed(() => {
    const allowed = new Set(STATUS_FILTER[this.status()])
    const ids = new Set(this.appearances().map((row) => row.id))
    return this.posts().filter(
      (slot) => allowed.has(slot.status) && slot.slideOrder.some((id) => ids.has(id)),
    )
  })

  ngOnInit(): void {
    this.reload()
  }
  ngOnDestroy(): void {
    this.pending?.unsubscribe()
  }

  protected onPreviousDay(): void {
    this.day.update((d) => shiftEditorialDay(d, -1))
    this.reload()
  }
  protected onNextDay(): void {
    this.day.update((d) => shiftEditorialDay(d, 1))
    this.reload()
  }
  protected kit(status: string): KitStatus {
    return asKit(status)
  }
  protected netStatus(slot: PublishSlot, network: Network): string {
    return slot.networkPosts.find((p) => p.network === network)?.status ?? '—'
  }
  protected openDrawer(slot: PublishSlot): void {
    this.selectedSlot.set(slot)
    this.drawerOpen.set(true)
  }
  protected closeDrawer(): void {
    this.drawerOpen.set(false)
  }
  protected onApproved(slot: PublishSlot): void {
    this.selectedSlot.set(slot)
    this.reload()
  }
  protected approveNext(): void {
    const slot = this.nextSlot()
    if (!slot || this.busy()) return
    this.busy.set(true)
    this.loadError.set(null)
    this.pending?.unsubscribe()
    this.pending = this.slotsApi.approve(slot.id).subscribe({
      next: () => {
        this.busy.set(false)
        this.reload()
      },
      error: () => {
        this.busy.set(false)
        this.loadError.set(this.copy.loadError)
      },
    })
  }
  protected reload(): void {
    const day = this.dayIso()
    const sportSlug = asSport(this.sport())
    this.loadError.set(null)
    this.pending?.unsubscribe()
    this.pending = forkJoin({
      next: this.slotsApi.next().pipe(catchError(() => of(null))),
      posts: this.slotsApi.listForDay(day).pipe(catchError(() => of([] as PublishSlot[]))),
      appearances: this.appearancesApi
        .list({ day, sportSlug })
        .pipe(catchError(() => of([] as EditorAppearance[]))),
    }).subscribe({
      next: ({ next, posts, appearances }) => {
        this.nextSlot.set(next)
        this.posts.set(posts)
        this.appearances.set(appearances)
      },
      error: () => this.loadError.set(this.copy.loadError),
    })
  }
}
