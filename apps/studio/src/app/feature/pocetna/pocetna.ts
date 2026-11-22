import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import type {
  Network,
  NetworkPostStatus,
  PublishSlotStatus,
  SportSlug,
} from '@cro-sport-hub/shared-types'
import { catchError, forkJoin, map, of, type Subscription } from 'rxjs'
import { AppearancesApi, type Appearance } from '../../core/appearances-api'
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
const STATUS_TO_SLOTS: Record<KitStatus, readonly PublishSlotStatus[]> = {
  draft: ['planned', 'waiting_for_data'],
  review: ['ready_for_review'],
  published: ['approved', 'published'],
}

export function editorialDayIso(day: Date): string {
  const y = day.getFullYear()
  const m = String(day.getMonth() + 1).padStart(2, '0')
  const d = String(day.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function sportSlug(tone: KitTone): SportSlug | undefined {
  if (tone === 'tennis' || tone === 'football' || tone === 'basketball') return tone
  return undefined
}

function kitStatus(status: PublishSlotStatus | NetworkPostStatus): KitStatus {
  if (status === 'published' || status === 'approved') return 'published'
  return status === 'ready_for_review' ? 'review' : 'draft'
}

function participantLabel(row: Appearance): string {
  if (row.nationalTeamId !== undefined) return row.nationalTeamId
  return row.athleteId ?? row.id
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

  protected readonly title = t('pocetna.title')
  protected readonly adminOnly = t('pocetna.admin-only')
  protected readonly nextHeading = t('pocetna.next-slot')
  protected readonly athletesHeading = t('pocetna.athletes-heading')
  protected readonly postsHeading = t('pocetna.posts-heading')
  protected readonly previewLabel = t('publish-drawer.preview')
  protected readonly approveLabel = t('publish-drawer.approve')
  protected readonly slidesLabel = t('pocetna.slides')
  protected readonly emptyNext = t('pocetna.empty-next')
  protected readonly emptyList = t('pocetna.empty-list')
  protected readonly loadErrorLabel = t('pocetna.load-error')
  protected readonly networks = NETWORKS

  protected readonly showAdminOnlyMessage = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('admin') === '1')),
    { initialValue: false },
  )

  protected readonly day = signal(startOfLocalDay())
  protected readonly dayLabel = computed(() => editorialDayLabel(this.day()))
  protected readonly dayIso = computed(() => editorialDayIso(this.day()))
  protected readonly sport = signal<KitTone>('tennis')
  protected readonly athlete = 'Svi sportaši'
  protected readonly status = signal<KitStatus>('draft')

  protected readonly nextSlot = signal<PublishSlot | null>(null)
  protected readonly appearances = signal<Appearance[]>([])
  protected readonly posts = signal<PublishSlot[]>([])
  protected readonly loadError = signal<string | null>(null)
  protected readonly busy = signal(false)
  protected readonly drawerOpen = signal(false)
  protected readonly selectedSlot = signal<PublishSlot | null>(null)

  protected readonly visiblePosts = computed(() => {
    const allowed = new Set(STATUS_TO_SLOTS[this.status()])
    const sport = sportSlug(this.sport())
    const appearanceIds = new Set(this.appearances().map((row) => row.id))
    return this.posts().filter((slot) => {
      if (!allowed.has(slot.status)) return false
      if (sport === undefined) return true
      return slot.slideOrder.some((id) => appearanceIds.has(id))
    })
  })

  ngOnInit(): void {
    this.reload()
  }

  ngOnDestroy(): void {
    this.pending?.unsubscribe()
  }

  protected onPreviousDay(): void {
    this.day.update((current) => shiftEditorialDay(current, -1))
    this.reload()
  }

  protected onNextDay(): void {
    this.day.update((current) => shiftEditorialDay(current, 1))
    this.reload()
  }

  protected appearanceLabel(row: Appearance): string {
    return participantLabel(row)
  }

  protected slotKitStatus(status: PublishSlotStatus): KitStatus {
    return kitStatus(status)
  }

  protected networkStatus(slot: PublishSlot, network: Network): string {
    return slot.networkPosts.find((post) => post.network === network)?.status ?? '—'
  }

  protected networkKitStatus(slot: PublishSlot, network: Network): KitStatus {
    const status = slot.networkPosts.find((post) => post.network === network)?.status
    if (status === undefined) return 'draft'
    return kitStatus(status)
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
      next: (updated) => {
        this.busy.set(false)
        this.nextSlot.set(updated)
        this.reload()
      },
      error: () => {
        this.busy.set(false)
        this.loadError.set(this.loadErrorLabel)
      },
    })
  }

  protected reload(): void {
    const day = this.dayIso()
    const sport = sportSlug(this.sport())
    this.loadError.set(null)
    this.pending?.unsubscribe()
    this.pending = forkJoin({
      next: this.slotsApi.next().pipe(catchError(() => of(null))),
      posts: this.slotsApi.listForDay(day).pipe(catchError(() => of([] as PublishSlot[]))),
      appearances: this.appearancesApi
        .list(sport === undefined ? { day } : { day, sportSlug: sport })
        .pipe(catchError(() => of([] as Appearance[]))),
    }).subscribe({
      next: ({ next, posts, appearances }) => {
        this.nextSlot.set(next)
        this.posts.set(posts)
        this.appearances.set(appearances)
      },
      error: () => this.loadError.set(this.loadErrorLabel),
    })
  }
}
