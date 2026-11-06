import { Component, inject, signal } from '@angular/core'
import { form, FormField, readonly } from '@angular/forms/signals'
import { HttpErrorResponse } from '@angular/common/http'
import { RouterLink } from '@angular/router'
import { teamSchema, type Team } from '@cro-sport-hub/shared-types'
import type { Subscription } from 'rxjs'
import {
  focusFirstFieldWithMessages,
  httpErrorBodyMessage,
  TEAM_FIELD_IDS,
  TEAM_FIELD_ORDER,
  teamFieldMessages,
} from '../../core/admin-form-messages'
import { StudioSectionHeader } from '../../core/studio-section-header'
import { TeamsAdminApi } from '../../core/teams-admin-api'

type LoadStatus = 'loading' | 'ready' | 'error'

type TeamFormModel = {
  id: string
  sportId: string
  slug: string
  name: string
  shortName: string
  country: string
}

const SPORT_FOOTBALL_ID = 'sport-football'

function emptyForm(): TeamFormModel {
  return {
    id: '',
    sportId: SPORT_FOOTBALL_ID,
    slug: '',
    name: '',
    shortName: '',
    country: '',
  }
}

function modelToBody(model: TeamFormModel): unknown {
  return {
    id: model.id,
    sportId: SPORT_FOOTBALL_ID,
    slug: model.slug,
    name: model.name,
    shortName: model.shortName,
    country: model.country,
  }
}

@Component({
  selector: 'app-teams-admin',
  imports: [FormField, RouterLink, StudioSectionHeader],
  templateUrl: './teams-admin.html',
})
export class TeamsAdminPage {
  private readonly api = inject(TeamsAdminApi)
  private listPending: Subscription | undefined

  protected readonly loadStatus = signal<LoadStatus>('loading')
  protected readonly rows = signal<Team[]>([])
  protected readonly model = signal<TeamFormModel>(emptyForm())
  protected readonly editingId = signal<string | null>(null)
  protected readonly saveError = signal<string | undefined>(undefined)
  protected readonly deleteError = signal<string | undefined>(undefined)
  protected readonly savePending = signal(false)
  protected readonly submitAttempted = signal(false)
  protected readonly fieldErrors = signal<Record<string, string>>({})

  protected readonly teamForm = form(this.model, (path) => {
    readonly(path.id, { when: () => this.editingId() !== null })
  })

  constructor() {
    this.reload()
  }

  protected loadForm(row?: Team): void {
    this.editingId.set(row?.id ?? null)
    this.model.set(
      row === undefined
        ? emptyForm()
        : {
            id: row.id,
            sportId: SPORT_FOOTBALL_ID,
            slug: row.slug,
            name: row.name,
            shortName: row.shortName,
            country: row.country,
          },
    )
    this.saveError.set(undefined)
    this.submitAttempted.set(false)
    this.fieldErrors.set({})
  }

  protected teamFieldError(
    key: 'id' | 'slug' | 'name' | 'shortName' | 'country',
  ): string | undefined {
    if (!this.submitAttempted()) return undefined
    return this.fieldErrors()[key]
  }

  protected onSave(event: Event): void {
    event.preventDefault()
    this.submitAttempted.set(true)
    this.saveError.set(undefined)
    this.fieldErrors.set({})
    const parsed = teamSchema.safeParse(modelToBody(this.model()))
    if (!parsed.success) {
      const messages = teamFieldMessages(this.model(), parsed.error)
      this.fieldErrors.set(messages)
      focusFirstFieldWithMessages(TEAM_FIELD_ORDER, messages, TEAM_FIELD_IDS)
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
          this.saveError.set(httpErrorBodyMessage(error, 'The club could not be saved.'))
          return
        }
        this.saveError.set('The club could not be saved.')
      },
    })
  }

  protected onDelete(row: Team): void {
    if (!globalThis.confirm(`Delete ${row.name}?`)) return
    this.deleteError.set(undefined)
    this.listPending?.unsubscribe()
    this.listPending = this.api.remove(row.id).subscribe({
      next: () => this.reload(),
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.deleteError.set(httpErrorBodyMessage(error, 'Team is in use'))
          return
        }
        this.deleteError.set('The club could not be deleted.')
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
