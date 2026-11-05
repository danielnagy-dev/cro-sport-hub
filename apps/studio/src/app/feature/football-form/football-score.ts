import { Component, computed, inject, signal } from '@angular/core'
import { form, FormField, disabled, readonly, submit, validate } from '@angular/forms/signals'
import { HttpErrorResponse } from '@angular/common/http'
import { RouterLink } from '@angular/router'
import {
  athleteLookupSchema,
  competitionLookupSchema,
  teamLookupSchema,
  type AthleteLookup,
  type CompetitionLookup,
  type Status,
  type TeamLookup,
} from '@cro-sport-hub/shared-types'
import { firstValueFrom } from 'rxjs'
import { AuthStore } from '../../core/auth'
import { StudioApi } from '../../core/studio-api'
import {
  buildFootballDraftBody,
  emptyAppearanceRow,
  initialFootballFormModel,
  newMatchId,
  validateFootballDraft,
  type FootballFormModel,
} from './draft-body'

const appearanceCountFields = [
  ['minutes', 'Minutes'],
  ['goals', 'Goals'],
  ['assists', 'Assists'],
  ['yellowCards', 'Yellow cards'],
] as const

type LookupState = 'loading' | 'ready' | 'error'
type FieldKey = keyof Omit<FootballFormModel, 'appearances'>

const fields = [
  ['competitionId', 'competition', 'Competition', 'Choose a competition', 'select'],
  ['date', 'match-date', 'Date', '', 'date'],
  ['round', 'round', 'Round', '', 'text'],
  ['homeTeamId', 'home-club', 'Home club', 'Choose the home club', 'select'],
  ['awayTeamId', 'away-club', 'Away club', 'Choose the away club', 'select'],
  ['homeGoals', 'home-goals', 'Home goals', '', 'number'],
  ['awayGoals', 'away-goals', 'Away goals', '', 'number'],
] as const

@Component({
  selector: 'app-football-score',
  imports: [FormField, RouterLink],
  templateUrl: './football-score.html',
})
export class FootballScorePage {
  private readonly api = inject(StudioApi)
  protected readonly auth = inject(AuthStore)
  protected readonly fieldConfigs = fields
  protected readonly appearanceCountFields = appearanceCountFields

  protected readonly model = signal<FootballFormModel>(initialFootballFormModel())
  protected readonly competitions = signal<CompetitionLookup[]>([])
  protected readonly teams = signal<TeamLookup[]>([])
  protected readonly athletes = signal<AthleteLookup[]>([])
  protected readonly lookupStatus = signal<LookupState>('loading')
  protected readonly saveError = signal<string | undefined>(undefined)
  protected readonly submitError = signal<string | undefined>(undefined)
  protected readonly savedId = signal<string | undefined>(undefined)
  protected readonly matchStatus = signal<Status | undefined>(undefined)
  protected readonly submitAttempted = signal(false)
  protected readonly submittingForReview = signal(false)
  protected readonly draftMatchId = newMatchId()

  protected readonly draftIssues = computed(() =>
    validateFootballDraft(this.model(), this.draftMatchId),
  )

  protected readonly footballForm = form(this.model, (path) => {
    const locked = () => this.savedId() !== undefined
    const issueFor = (field: string) => this.draftIssues().find((entry) => entry.path[0] === field)
    const bind = (fieldPath: (typeof path)[FieldKey], field: FieldKey) => {
      validate(fieldPath, () => {
        const issue = issueFor(field)
        return issue === undefined ? undefined : { kind: 'schema', message: issue.message }
      })
      disabled(fieldPath, { when: locked })
    }
    for (const key of [
      'competitionId',
      'date',
      'round',
      'homeTeamId',
      'awayTeamId',
      'homeGoals',
      'awayGoals',
    ] as const) {
      bind(path[key], key)
    }
    readonly(path.date, { when: locked })
    readonly(path.round, { when: locked })
  })

  constructor() {
    void this.loadLookups()
  }

  protected formField(key: FieldKey) {
    return this.footballForm[key]
  }

  protected appearanceStringField(
    index: number,
    key: 'athleteId' | 'teamId' | 'minutes' | 'goals' | 'assists' | 'yellowCards',
  ) {
    return this.footballForm.appearances[index][key]
  }

  protected appearanceBoolField(index: number, key: 'started' | 'redCard') {
    return this.footballForm.appearances[index][key]
  }

  protected lookupRows(key: FieldKey) {
    return key === 'competitionId' ? this.competitions() : this.teams()
  }

  protected optionLabel(key: FieldKey, row: CompetitionLookup | TeamLookup): string {
    return key === 'competitionId' && 'season' in row ? `${row.name} (${row.season})` : row.name
  }

  protected matchClubs(): TeamLookup[] {
    const model = this.model()
    return this.teams().filter(
      (team) => team.id === model.homeTeamId || team.id === model.awayTeamId,
    )
  }

  protected fieldMessage(field: FieldKey): string | undefined {
    if (!this.submitAttempted() && !this.footballForm[field]().touched()) return undefined
    return this.draftIssues().find((issue) => issue.path[0] === field)?.message
  }

  protected showErrors(field: FieldKey): boolean {
    return this.fieldMessage(field) !== undefined
  }

  protected appearanceErrors(index?: number): readonly string[] {
    if (!this.submitAttempted()) return []
    return this.draftIssues()
      .filter((issue) => {
        if (issue.path[0] !== 'appearances') return false
        if (index === undefined) return issue.path.length === 1
        return issue.path[1] === String(index)
      })
      .map((issue) => issue.message)
  }

  protected canSubmitForReview(): boolean {
    return this.matchStatus() === 'draft' && !this.submittingForReview()
  }

  protected addAppearance(): void {
    if (this.savedId() !== undefined) return
    this.model.update((current) => ({
      ...current,
      appearances: [...current.appearances, emptyAppearanceRow()],
    }))
  }

  protected removeAppearance(index: number): void {
    if (this.savedId() !== undefined) return
    this.model.update((current) => ({
      ...current,
      appearances: current.appearances.filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  protected onSubmit(event: Event): void {
    event.preventDefault()
    if (this.savedId() !== undefined) return
    this.submitAttempted.set(true)
    this.footballForm().markAsTouched()
    if (this.draftIssues().length > 0) return
    void this.save()
  }

  protected onSubmitForReview(): void {
    if (this.savedId() === undefined || this.matchStatus() !== 'draft') return
    void this.sendForReview()
  }

  private async loadLookups(): Promise<void> {
    this.lookupStatus.set('loading')
    try {
      const [competitions, teams, athletes] = await Promise.all([
        firstValueFrom(this.api.editorCompetitions('football')),
        firstValueFrom(this.api.editorTeams()),
        firstValueFrom(this.api.editorAthletes('football')),
      ])
      this.competitions.set(competitionLookupSchema.array().parse(competitions))
      this.teams.set(teamLookupSchema.array().parse(teams))
      this.athletes.set(athleteLookupSchema.array().parse(athletes))
      this.lookupStatus.set('ready')
    } catch {
      this.lookupStatus.set('error')
    }
  }

  private async save(): Promise<void> {
    if (this.footballForm().submitting()) return
    this.saveError.set(undefined)
    await submit(this.footballForm, {
      action: async () => {
        try {
          const saved = await firstValueFrom(
            this.api.createFootballDraft(buildFootballDraftBody(this.model(), this.draftMatchId)),
          )
          this.savedId.set(saved.id)
          this.matchStatus.set('draft')
        } catch {
          this.saveError.set('The football match could not be saved.')
        }
        return undefined
      },
    })
  }

  private async sendForReview(): Promise<void> {
    const id = this.savedId()
    if (id === undefined || this.submittingForReview()) return
    this.submitError.set(undefined)
    this.submittingForReview.set(true)
    try {
      const saved = await firstValueFrom(this.api.submitMatch(id))
      this.matchStatus.set(saved.status)
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        const body: unknown = error.error
        let message = 'Only a draft can be submitted'
        if (
          typeof body === 'object' &&
          body !== null &&
          'message' in body &&
          typeof body.message === 'string'
        ) {
          message = body.message
        }
        this.submitError.set(message)
      } else {
        this.submitError.set('The match could not be submitted for review.')
      }
    } finally {
      this.submittingForReview.set(false)
    }
  }
}
