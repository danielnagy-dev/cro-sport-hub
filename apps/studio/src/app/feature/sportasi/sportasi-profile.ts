import { Component, DestroyRef, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterLink } from '@angular/router'
import type { SportSlug } from '@cro-sport-hub/shared-types'
import { catchError, combineLatest, forkJoin, of, type Subscription } from 'rxjs'
import { AppearancesApi, type EditorAppearance } from '../../core/appearances-api'
import { EditorAthletesApi, type EditorAthlete } from '../../core/editor-athletes-api'
import { t } from '../../core/messages'
import { PublishSlotsApi, type NetworkPost, type PublishSlot } from '../../core/publish-slots-api'
import { SourcesApi, type AppearanceSource } from '../../core/sources-api'
import { StudioSectionHeader } from '../../core/studio-section-header'

type ProfilePost = NetworkPost & { slotDate: string; clockTime: string }

function parseSport(value: string | null): SportSlug | null {
  return value === 'football' || value === 'basketball' || value === 'tennis' ? value : null
}

function splitAppearances(
  rows: EditorAppearance[],
  now: string,
): { next: EditorAppearance[]; history: EditorAppearance[] } {
  const next: EditorAppearance[] = []
  const history: EditorAppearance[] = []
  for (const row of rows) (row.startsAt >= now ? next : history).push(row)
  return { next, history }
}

function postsForAppearances(slots: PublishSlot[], appearanceIds: Set<string>): ProfilePost[] {
  const out: ProfilePost[] = []
  for (const slot of slots) {
    if (!slot.slideOrder.some((id) => appearanceIds.has(id))) continue
    for (const post of slot.networkPosts) {
      out.push({ ...post, slotDate: slot.slotDate, clockTime: slot.clockTime })
    }
  }
  return out
}

@Component({
  selector: 'app-sportasi-profile',
  imports: [RouterLink, StudioSectionHeader],
  templateUrl: './sportasi-profile.html',
})
export class SportasiProfilePage {
  private readonly athletes = inject(EditorAthletesApi)
  private readonly appearances = inject(AppearancesApi)
  private readonly sourcesApi = inject(SourcesApi)
  private readonly slots = inject(PublishSlotsApi)
  private readonly route = inject(ActivatedRoute)
  private readonly destroyRef = inject(DestroyRef)
  private pending: Subscription | undefined

  protected readonly m = {
    skip: 'Preskoči na profil sportaša',
    back: t('sportasi.title'),
    loading: 'Učitavanje profila.',
    loadError: 'Profil sportaša nije moguće učitati.',
    missing: 'Sportaš nije pronađen.',
    next: 'Sljedeći nastupi',
    history: 'Povijest nastupa',
    posts: 'Objave',
    sources: 'Izvori',
    emptyNext: 'Nema nadolazećih nastupa.',
    emptyHistory: 'Nema prošlih nastupa.',
    emptyPosts: 'Nema objava za ovog sportaša.',
    emptySources: 'Nema izvora za nastupe ovog sportaša.',
  } as const

  protected readonly loadStatus = signal<'loading' | 'ready' | 'error' | 'missing'>('loading')
  protected readonly athlete = signal<EditorAthlete | null>(null)
  protected readonly next = signal<EditorAppearance[]>([])
  protected readonly history = signal<EditorAppearance[]>([])
  protected readonly posts = signal<ProfilePost[]>([])
  protected readonly sourceRows = signal<AppearanceSource[]>([])

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload())
  }

  private clearRelated(): void {
    this.next.set([])
    this.history.set([])
    this.posts.set([])
    this.sourceRows.set([])
  }

  private reload(): void {
    const id = this.route.snapshot.paramMap.get('id')?.trim() ?? ''
    const sport = parseSport(this.route.snapshot.queryParamMap.get('sport'))
    if (id.length === 0 || sport === null) {
      this.athlete.set(null)
      this.clearRelated()
      this.loadStatus.set('missing')
      return
    }
    this.pending?.unsubscribe()
    this.loadStatus.set('loading')
    this.pending = this.athletes.list(sport).subscribe({
      next: (rows) => {
        const found = rows.find((row) => row.id === id) ?? null
        if (found === null) {
          this.athlete.set(null)
          this.clearRelated()
          this.loadStatus.set('missing')
          return
        }
        this.athlete.set(found)
        this.loadRelated(found.id)
      },
      error: () => this.loadStatus.set('error'),
    })
  }

  private loadRelated(athleteId: string): void {
    this.pending?.unsubscribe()
    this.pending = this.appearances.listForAthlete(athleteId).subscribe({
      next: (rows) => {
        const split = splitAppearances(rows, new Date().toISOString())
        this.next.set(split.next)
        this.history.set(split.history)
        const appearanceIds = new Set(rows.map((row) => row.id))
        const days = [...new Set(rows.map((row) => row.startsAt.slice(0, 10)))]
        const sourceCalls =
          rows.length === 0
            ? [of([] as AppearanceSource[])]
            : rows.map((row) =>
                this.sourcesApi.listForAppearance(row.id).pipe(catchError(() => of([]))),
              )
        const slotCalls =
          days.length === 0
            ? [of([] as PublishSlot[])]
            : days.map((day) => this.slots.listForDay(day).pipe(catchError(() => of([]))))
        this.pending = forkJoin({
          sources: forkJoin(sourceCalls),
          slots: forkJoin(slotCalls),
        }).subscribe({
          next: ({ sources, slots }) => {
            this.sourceRows.set(sources.flat())
            this.posts.set(postsForAppearances(slots.flat(), appearanceIds))
            this.loadStatus.set('ready')
          },
          error: () => {
            this.sourceRows.set([])
            this.posts.set([])
            this.loadStatus.set('ready')
          },
        })
      },
      error: () => this.loadStatus.set('error'),
    })
  }
}
