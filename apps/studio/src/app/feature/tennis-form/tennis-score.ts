import { Component, inject, signal } from '@angular/core'
import { form, FormField, disabled, readonly, submit, validate } from '@angular/forms/signals'
import { RouterLink } from '@angular/router'
import {
  athleteLookupSchema,
  competitionLookupSchema,
  type AthleteLookup,
  type CompetitionLookup,
} from '@cro-sport-hub/shared-types'
import { firstValueFrom } from 'rxjs'
import { AuthStore } from '../../core/auth'
import { StudioApi } from '../../core/studio-api'
import {
  buildTennisDraftBody,
  initialTennisFormModel,
  newMatchId,
  validateTennisDraft,
  type TennisFormModel,
} from './draft-body'

type LookupState = 'loading' | 'ready' | 'error'

@Component({
  selector: 'app-tennis-score',
  imports: [FormField, RouterLink],
  templateUrl: './tennis-score.html',
})
export class TennisScorePage {
  private readonly api = inject(StudioApi)
  protected readonly auth = inject(AuthStore)

  protected readonly model = signal<TennisFormModel>(initialTennisFormModel())
  protected readonly competitions = signal<CompetitionLookup[]>([])
  protected readonly athletes = signal<AthleteLookup[]>([])
  protected readonly lookupStatus = signal<LookupState>('loading')
  protected readonly saveError = signal<string | undefined>(undefined)
  protected readonly savedId = signal<string | undefined>(undefined)
  protected readonly submitAttempted = signal(false)
  protected readonly draftMatchId = newMatchId()

  protected readonly tennisForm = form(this.model, (path) => {
    const locked = () => this.savedId() !== undefined
    const issueFor = (field: string) =>
      validateTennisDraft(this.model(), this.draftMatchId).find((entry) => entry.path[0] === field)
    const bindIssue = (fieldPath: typeof path.competitionId, field: string) => {
      validate(fieldPath, () => {
        const issue = issueFor(field)
        return issue === undefined ? undefined : { kind: 'schema', message: issue.message }
      })
      disabled(fieldPath, { when: locked })
    }
    bindIssue(path.competitionId, 'competitionId')
    bindIssue(path.date, 'date')
    bindIssue(path.round, 'round')
    bindIssue(path.playerAId, 'playerAId')
    bindIssue(path.playerBId, 'playerBId')
    bindIssue(path.winnerId, 'winnerId')
    bindIssue(path.bestOf, 'bestOf')
    readonly(path.date, { when: locked })
    readonly(path.round, { when: locked })
    disabled(path.retired, { when: locked })
    validate(path.sets, () => {
      const issue = issueFor('score')
      return issue === undefined ? undefined : { kind: 'schema', message: issue.message }
    })
    disabled(path.sets, { when: locked })
  })

  constructor() {
    void this.loadLookups()
  }

  protected fieldMessage(field: keyof TennisFormModel | 'score'): string | undefined {
    if (!this.submitAttempted()) {
      const tree = field === 'score' ? this.tennisForm.sets() : this.tennisForm[field]()
      if (!tree.touched()) return undefined
    }
    return validateTennisDraft(this.model(), this.draftMatchId).find(
      (issue) => issue.path[0] === field,
    )?.message
  }

  protected showErrors(field: keyof TennisFormModel | 'score'): boolean {
    return this.fieldMessage(field) !== undefined
  }

  protected setIndex(index: number): number {
    return index + 1
  }

  protected onSubmit(event: Event): void {
    event.preventDefault()
    if (this.savedId() !== undefined) return
    this.submitAttempted.set(true)
    this.tennisForm().markAsTouched()
    void this.send()
  }

  private async loadLookups(): Promise<void> {
    this.lookupStatus.set('loading')
    try {
      const [competitions, athletes] = await Promise.all([
        firstValueFrom(this.api.editorCompetitions('tennis')),
        firstValueFrom(this.api.editorAthletes('tennis')),
      ])
      this.competitions.set(competitionLookupSchema.array().parse(competitions))
      this.athletes.set(athleteLookupSchema.array().parse(athletes))
      this.lookupStatus.set('ready')
    } catch {
      this.lookupStatus.set('error')
    }
  }

  private async send(): Promise<void> {
    if (this.tennisForm().submitting()) return
    if (validateTennisDraft(this.model(), this.draftMatchId).length > 0) return
    this.saveError.set(undefined)
    const accepted = await submit(this.tennisForm, {
      action: async () => {
        const body = buildTennisDraftBody(this.model(), this.draftMatchId)
        try {
          const saved = await firstValueFrom(this.api.createTennisDraft(body))
          this.savedId.set(saved.id)
          return undefined
        } catch {
          this.saveError.set('The tennis match could not be saved.')
          return undefined
        }
      },
    })
    if (!accepted || this.saveError() !== undefined) this.focusProblem()
  }

  private focusProblem(): void {
    setTimeout(() => {
      const alert = document.getElementById('tennis-save-error')
      const invalid = document.querySelector('[aria-invalid="true"]')
      ;(alert ?? invalid)?.scrollIntoView({ block: 'nearest' })
      if (alert instanceof HTMLElement) alert.focus()
      else if (invalid instanceof HTMLElement) invalid.focus()
    })
  }
}
