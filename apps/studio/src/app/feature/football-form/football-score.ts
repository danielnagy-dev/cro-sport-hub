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
type FieldKey = keyof FootballFormModel

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

  protected lookupRows(key: FieldKey) {
    return key === 'competitionId' ? this.competitions() : this.teams()
  }

  protected optionLabel(key: FieldKey, row: CompetitionLookup | TeamLookup): string {
    return key === 'competitionId' && 'season' in row ? `${row.name} (${row.season})` : row.name
  }

  protected fieldMessage(field: FieldKey): string | undefined {
    if (!this.submitAttempted() && !this.footballForm[field]().touched()) return undefined
    return this.draftIssues().find((issue) => issue.path[0] === field)?.message
  }

  protected showErrors(field: FieldKey): boolean {
    return this.fieldMessage(field) !== undefined
  }

  protected onSubmit(event: Event): void {
    event.preventDefault()
    if (this.savedId() !== undefined) return
    this.submitAttempted.set(true)
    this.footballForm().markAsTouched()
    if (this.draftIssues().length > 0) return
    void this.save()
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
        } catch {
          this.saveError.set('The football match could not be saved.')
        }
        return undefined
      },
    })
  }
}
