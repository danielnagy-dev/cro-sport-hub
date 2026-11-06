import { Component, inject, signal } from '@angular/core'
import { form, FormField, readonly } from '@angular/forms/signals'
import { HttpErrorResponse } from '@angular/common/http'
import { RouterLink } from '@angular/router'
import {
  competitionSchema,
  type Competition,
  type CompetitionLevel,
  type Sport,
} from '@cro-sport-hub/shared-types'
import type { Subscription } from 'rxjs'
import {
  COMPETITION_FIELD_IDS,
  COMPETITION_FIELD_ORDER,
  competitionFieldMessages,
  focusFirstFieldWithMessages,
  httpErrorBodyMessage,
} from '../../core/admin-form-messages'
import { CatalogApi } from '../../core/catalog-api'
import { StudioSectionHeader } from '../../core/studio-section-header'
import { CompetitionsAdminApi } from '../../core/competitions-admin-api'

type LoadStatus = 'loading' | 'ready' | 'error'

type CompetitionFormModel = {
  id: string
  sportId: string
  name: string
  season: string
  level: CompetitionLevel | ''
}

const LEVELS = ['domestic', 'international'] as const satisfies readonly CompetitionLevel[]

function emptyForm(): CompetitionFormModel {
  return { id: '', sportId: '', name: '', season: '', level: '' }
}

function modelToBody(model: CompetitionFormModel): unknown {
  return {
    id: model.id,
    sportId: model.sportId,
    name: model.name,
    season: model.season,
    level: model.level === '' ? undefined : model.level,
  }
}

@Component({
  selector: 'app-competitions-admin',
  imports: [FormField, RouterLink, StudioSectionHeader],
  templateUrl: './competitions-admin.html',
})
export class CompetitionsAdminPage {
  private readonly api = inject(CompetitionsAdminApi)
  private readonly catalog = inject(CatalogApi)
  private listPending: Subscription | undefined
  private sportsPending: Subscription | undefined

  protected readonly loadStatus = signal<LoadStatus>('loading')
  protected readonly rows = signal<Competition[]>([])
  protected readonly sports = signal<Sport[]>([])
  protected readonly model = signal<CompetitionFormModel>(emptyForm())
  protected readonly editingId = signal<string | null>(null)
  protected readonly saveError = signal<string | undefined>(undefined)
  protected readonly deleteError = signal<string | undefined>(undefined)
  protected readonly savePending = signal(false)
  protected readonly submitAttempted = signal(false)
  protected readonly fieldErrors = signal<Record<string, string>>({})
  protected readonly levels = LEVELS

  protected readonly competitionForm = form(this.model, (path) => {
    readonly(path.id, { when: () => this.editingId() !== null })
  })

  constructor() {
    this.sportsPending = this.catalog.sports().subscribe({
      next: (items) => this.sports.set(items),
      error: () => this.sports.set([]),
    })
    this.reload()
  }

  protected sportLabel(sportId: string): string {
    return this.sports().find((sport) => sport.id === sportId)?.name ?? sportId
  }

  protected competitionFieldError(
    key: 'id' | 'sportId' | 'name' | 'season' | 'level',
  ): string | undefined {
    if (!this.submitAttempted()) return undefined
    return this.fieldErrors()[key]
  }

  protected loadForm(row?: Competition): void {
    this.editingId.set(row?.id ?? null)
    this.model.set(
      row === undefined
        ? emptyForm()
        : {
            id: row.id,
            sportId: row.sportId,
            name: row.name,
            season: row.season,
            level: row.level,
          },
    )
    this.saveError.set(undefined)
    this.submitAttempted.set(false)
    this.fieldErrors.set({})
  }

  protected onSave(event: Event): void {
    event.preventDefault()
    this.submitAttempted.set(true)
    this.saveError.set(undefined)
    this.fieldErrors.set({})
    const parsed = competitionSchema.safeParse(modelToBody(this.model()))
    if (!parsed.success) {
      const messages = competitionFieldMessages(this.model(), parsed.error)
      this.fieldErrors.set(messages)
      focusFirstFieldWithMessages(COMPETITION_FIELD_ORDER, messages, COMPETITION_FIELD_IDS)
      return
    }
    if (this.savePending()) return
    this.savePending.set(true)
    const editing = this.editingId()
    this.listPending?.unsubscribe()
    const request =
      editing === null ? this.api.create(parsed.data) : this.api.update(editing, parsed.data)
    this.listPending = request.subscribe({
      next: () => {
        this.savePending.set(false)
        this.loadForm()
        this.reload()
      },
      error: (error: unknown) => {
        this.savePending.set(false)
        if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 409)) {
          this.saveError.set(httpErrorBodyMessage(error, 'The competition could not be saved.'))
          return
        }
        this.saveError.set('The competition could not be saved.')
      },
    })
  }

  protected onDelete(row: Competition): void {
    if (!globalThis.confirm(`Delete ${row.name}?`)) return
    this.deleteError.set(undefined)
    this.listPending?.unsubscribe()
    this.listPending = this.api.remove(row.id).subscribe({
      next: () => this.reload(),
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.deleteError.set(httpErrorBodyMessage(error, 'Competition is in use'))
          return
        }
        this.deleteError.set('The competition could not be deleted.')
      },
    })
  }

  private reload(): void {
    this.listPending?.unsubscribe()
    this.loadStatus.set('loading')
    this.listPending = this.api.list().subscribe({
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
