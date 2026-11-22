import { HttpErrorResponse } from '@angular/common/http'
import { Component, DestroyRef, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { form, FormField, readonly } from '@angular/forms/signals'
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router'
import { athleteSchema, type SportSlug } from '@cro-sport-hub/shared-types'
import type { Subscription } from 'rxjs'
import { focusFirstFieldWithMessages, httpErrorBodyMessage } from '../../core/admin-form-messages'
import {
  EditorAthletesApi,
  sportIdForSlug,
  type EditorAthlete,
} from '../../core/editor-athletes-api'
import { t } from '../../core/messages'
import { StudioSectionHeader } from '../../core/studio-section-header'

type FormModel = { id: string; slug: string; name: string; sport: SportSlug; country: string }

const FIELD_ORDER = ['id', 'slug', 'name', 'sportId', 'country'] as const
const FIELD_IDS: Record<(typeof FIELD_ORDER)[number], string> = {
  id: 'athlete-id',
  slug: 'athlete-slug',
  name: 'athlete-name',
  sportId: 'athlete-sport',
  country: 'athlete-country',
}
const SPORTS: readonly SportSlug[] = ['tennis', 'football', 'basketball']

function emptyForm(sport: SportSlug): FormModel {
  return { id: '', slug: '', name: '', sport, country: 'HR' }
}

function parseSport(value: string | null): SportSlug {
  return value === 'football' || value === 'basketball' || value === 'tennis' ? value : 'tennis'
}

function fieldMessages(model: FormModel): Record<string, string> {
  const out: Record<string, string> = {}
  const parsed = athleteSchema.safeParse({
    id: model.id,
    slug: model.slug,
    name: model.name,
    sportId: sportIdForSlug(model.sport),
    country: model.country,
  })
  if (!parsed.success) {
    for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      if (msgs?.[0]) out[key] = msgs[0]
    }
  }
  return out
}

@Component({
  selector: 'app-sportasi',
  imports: [FormField, RouterLink, StudioSectionHeader],
  templateUrl: './sportasi.html',
})
export class SportasiPage {
  private readonly api = inject(EditorAthletesApi)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)
  private pending: Subscription | undefined

  protected readonly m = {
    skip: t('sportasi.skip'),
    title: t('sportasi.title'),
    empty: t('sportasi.lead'),
    loading: 'Učitavanje sportaša.',
    loadError: 'Popis sportaša nije moguće učitati.',
    filterSport: 'Sport',
    create: 'Novi sportaš',
    update: 'Uredi sportaša',
    save: 'Spremi',
    saveError: 'Sportaša nije moguće spremiti.',
  } as const
  protected readonly sports = SPORTS
  protected readonly sportLabel = {
    tennis: 'Tenis',
    football: 'Nogomet',
    basketball: 'Košarka',
  } as const

  protected readonly loadStatus = signal<'loading' | 'ready' | 'error'>('loading')
  protected readonly rows = signal<EditorAthlete[]>([])
  protected readonly sport = signal<SportSlug>('tennis')
  protected readonly model = signal<FormModel>(emptyForm('tennis'))
  protected readonly editingId = signal<string | null>(null)
  protected readonly saveError = signal<string | undefined>(undefined)
  protected readonly savePending = signal(false)
  protected readonly submitAttempted = signal(false)
  protected readonly fieldErrors = signal<Record<string, string>>({})
  protected readonly athleteForm = form(this.model, (path) => {
    readonly(path.id, { when: () => this.editingId() !== null })
  })

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      this.syncFromQuery(p)
    })
  }

  protected onSportFilter(event: Event): void {
    const target = event.target
    const sport = parseSport(target instanceof HTMLSelectElement ? target.value : null)
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sport },
      replaceUrl: true,
    })
  }

  protected loadForm(row?: EditorAthlete): void {
    const sport = this.sport()
    this.editingId.set(row?.id ?? null)
    this.model.set(
      row
        ? {
            id: row.id,
            slug: row.slug,
            name: row.name,
            sport,
            country: row.country,
          }
        : emptyForm(sport),
    )
    this.saveError.set(undefined)
    this.submitAttempted.set(false)
    this.fieldErrors.set({})
  }

  protected onSave(event: Event): void {
    event.preventDefault()
    this.submitAttempted.set(true)
    this.saveError.set(undefined)
    const messages = fieldMessages(this.model())
    this.fieldErrors.set(messages)
    if (Object.keys(messages).length > 0) {
      focusFirstFieldWithMessages(FIELD_ORDER, messages, FIELD_IDS)
      return
    }
    if (this.savePending()) return
    this.savePending.set(true)
    const cur = this.model()
    const body: EditorAthlete = {
      id: cur.id,
      slug: cur.slug,
      name: cur.name,
      sportId: sportIdForSlug(cur.sport),
      country: cur.country,
    }
    const editing = this.editingId()
    this.pending?.unsubscribe()
    this.pending = (
      editing === null ? this.api.create(body) : this.api.update(editing, body)
    ).subscribe({
      next: () => {
        this.savePending.set(false)
        this.loadForm()
        this.reload()
      },
      error: (error: unknown) => {
        this.savePending.set(false)
        const fallback = this.m.saveError
        const bad =
          error instanceof HttpErrorResponse && (error.status === 400 || error.status === 409)
        this.saveError.set(bad ? httpErrorBodyMessage(error, fallback) : fallback)
      },
    })
  }

  private syncFromQuery(params: ParamMap): void {
    const sport = parseSport(params.get('sport'))
    this.sport.set(sport)
    if (this.editingId() === null) this.model.update((cur) => ({ ...cur, sport }))
    this.reload()
  }

  private reload(): void {
    this.pending?.unsubscribe()
    this.loadStatus.set('loading')
    this.pending = this.api.list(this.sport()).subscribe({
      next: (items) => {
        this.rows.set(items)
        this.loadStatus.set('ready')
      },
      error: () => {
        this.rows.set([])
        this.loadStatus.set('error')
      },
    })
  }
}
