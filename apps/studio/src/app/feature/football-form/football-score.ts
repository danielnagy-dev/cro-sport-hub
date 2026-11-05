import { Component, computed, inject, signal } from '@angular/core'
import { form, FormField, disabled, readonly, submit, validate } from '@angular/forms/signals'
import { RouterLink } from '@angular/router'
import {
  competitionLookupSchema,
  teamLookupSchema,
  type CompetitionLookup,
  type TeamLookup,
} from '@cro-sport-hub/shared-types'
import { firstValueFrom } from 'rxjs'
import { AuthStore } from '../../core/auth'
import { StudioApi } from '../../core/studio-api'
import {
  buildFootballDraftBody,
  initialFootballFormModel,
  newMatchId,
  validateFootballDraft,
  type FootballFormModel,
} from './draft-body'

type LookupState = 'loading' | 'ready' | 'error'

@Component({
  selector: 'app-football-score',
  imports: [FormField, RouterLink],
  templateUrl: './football-score.html',
})
export class FootballScorePage {
  private readonly api = inject(StudioApi)
  protected readonly auth = inject(AuthStore)

  protected readonly model = signal<FootballFormModel>(initialFootballFormModel())
  protected readonly competitions = signal<CompetitionLookup[]>([])
  protected readonly teams = signal<TeamLookup[]>([])
  protected readonly lookupStatus = signal<LookupState>('loading')
  protected readonly saveError = signal<string | undefined>(undefined)
  protected readonly savedId = signal<string | undefined>(undefined)
  protected readonly submitAttempted = signal(false)
  protected readonly draftMatchId = newMatchId()

  protected readonly draftIssues = computed(() =>
    validateFootballDraft(this.model(), this.draftMatchId),
  )

  protected readonly footballForm = form(this.model, (path) => {
    const locked = () => this.savedId() !== undefined
    const issueFor = (field: string) => this.draftIssues().find((entry) => entry.path[0] === field)
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
    bindIssue(path.homeTeamId, 'homeTeamId')
    bindIssue(path.awayTeamId, 'awayTeamId')
    bindIssue(path.homeGoals, 'homeGoals')
    bindIssue(path.awayGoals, 'awayGoals')
    readonly(path.date, { when: locked })
    readonly(path.round, { when: locked })
  })

  constructor() {
    void this.loadLookups()
  }

  protected fieldMessage(field: keyof FootballFormModel): string | undefined {
    if (!this.submitAttempted()) {
      const tree = this.footballForm[field]()
      if (!tree.touched()) return undefined
    }
    return this.draftIssues().find((issue) => issue.path[0] === field)?.message
  }

  protected showErrors(field: keyof FootballFormModel): boolean {
    return this.fieldMessage(field) !== undefined
  }

  protected onSubmit(event: Event): void {
    event.preventDefault()
    if (this.savedId() !== undefined) return
    this.submitAttempted.set(true)
    this.footballForm().markAsTouched()
    void this.send()
  }

  private async loadLookups(): Promise<void> {
    this.lookupStatus.set('loading')
    try {
      const [competitions, teams] = await Promise.all([
        firstValueFrom(this.api.editorCompetitions('football')),
        firstValueFrom(this.api.editorTeams()),
      ])
      this.competitions.set(competitionLookupSchema.array().parse(competitions))
      this.teams.set(teamLookupSchema.array().parse(teams))
      this.lookupStatus.set('ready')
    } catch {
      this.lookupStatus.set('error')
    }
  }

  private async send(): Promise<void> {
    if (this.footballForm().submitting()) return
    if (this.draftIssues().length > 0) return
    this.saveError.set(undefined)
    const accepted = await submit(this.footballForm, {
      action: async () => {
        const body = buildFootballDraftBody(this.model(), this.draftMatchId)
        try {
          const saved = await firstValueFrom(this.api.createFootballDraft(body))
          this.savedId.set(saved.id)
          return undefined
        } catch {
          this.saveError.set('The football match could not be saved.')
          return undefined
        }
      },
    })
    if (!accepted || this.saveError() !== undefined) this.focusProblem()
  }

  private focusProblem(): void {
    setTimeout(() => {
      const alert = document.getElementById('football-save-error')
      const invalid = document.querySelector('[aria-invalid="true"]')
      ;(alert ?? invalid)?.scrollIntoView({ block: 'nearest' })
      if (alert instanceof HTMLElement) alert.focus()
      else if (invalid instanceof HTMLElement) invalid.focus()
    })
  }
}
