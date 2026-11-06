import { Component, inject, signal } from '@angular/core'
import { form, FormField, readonly } from '@angular/forms/signals'
import { HttpErrorResponse } from '@angular/common/http'
import { RouterLink } from '@angular/router'
import { teamSchema, type Team } from '@cro-sport-hub/shared-types'
import type { Subscription } from 'rxjs'
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

function conflictMessage(error: HttpErrorResponse, fallback: string): string {
  const body: unknown = error.error
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = body.message
    if (typeof message === 'string') return message
  }
  return fallback
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
  }

  protected onSave(event: Event): void {
    event.preventDefault()
    this.submitAttempted.set(true)
    this.saveError.set(undefined)
    const parsed = teamSchema.safeParse(modelToBody(this.model()))
    if (!parsed.success) return
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
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.saveError.set(conflictMessage(error, 'That record is already stored'))
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
          this.deleteError.set(conflictMessage(error, 'Team is in use'))
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
