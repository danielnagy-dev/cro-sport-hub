import { Component, computed, inject, signal, afterNextRender } from '@angular/core'
import { form, FormField, disabled, readonly, submit, validate } from '@angular/forms/signals'
import { HttpErrorResponse } from '@angular/common/http'
import { ActivatedRoute, RouterLink, Router } from '@angular/router'
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
import { FootballApi } from '../../core/football-api'
import { StudioApi } from '../../core/studio-api'
import {
  buildFootballDraftBody,
  emptyAppearanceRow,
  footballFormFromDraft,
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
type PageLoadState = 'loading' | 'ready' | 'not-found' | 'error'

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
  private readonly footballApi = inject(FootballApi)
  private readonly workflowApi = inject(StudioApi)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  protected readonly auth = inject(AuthStore)
  protected readonly fieldConfigs = fields
  protected readonly appearanceCountFields = appearanceCountFields

  protected readonly routeMatchId = signal<string | undefined>(undefined)
  protected readonly isEditMode = computed(() => this.routeMatchId() !== undefined)
  protected readonly pageLoadState = signal<PageLoadState>('loading')

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
  protected readonly activeMatchId = computed(() => this.routeMatchId() ?? this.draftMatchId)

  protected readonly draftIssues = computed(() =>
    validateFootballDraft(this.model(), this.activeMatchId()),
  )

  protected readonly footballForm = form(this.model, (path) => {
    const locked = () => {
      if (this.isEditMode()) return this.matchStatus() !== 'draft'
      return this.savedId() !== undefined
    }
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
    void this.bootLookups()
    afterNextRender(() => {
      void this.bootDraft()
    })
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

  protected formEditable(): boolean {
    if (this.isEditMode()) return this.matchStatus() === 'draft'
    return this.savedId() === undefined
  }

  protected addAppearance(): void {
    if (!this.formEditable()) return
    this.model.update((current) => ({
      ...current,
      appearances: [...current.appearances, emptyAppearanceRow()],
    }))
  }

  protected removeAppearance(index: number): void {
    if (!this.formEditable()) return
    this.model.update((current) => ({
      ...current,
      appearances: current.appearances.filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  protected onSubmit(event: Event): void {
    event.preventDefault()
    if (!this.isEditMode() && this.savedId() !== undefined) return
    if (this.isEditMode() && this.matchStatus() !== 'draft') return
    this.submitAttempted.set(true)
    this.footballForm().markAsTouched()
    if (this.draftIssues().length > 0) return
    void this.save()
  }

  protected onSubmitForReview(): void {
    if (this.savedId() === undefined || this.matchStatus() !== 'draft') return
    void this.sendForReview()
  }

  private async bootLookups(): Promise<void> {
    this.pageLoadState.set('loading')
    await this.loadLookups()
    if (this.lookupStatus() === 'ready' && this.editMatchId() === undefined) {
      this.pageLoadState.set('ready')
    }
  }

  private async bootDraft(): Promise<void> {
    const matchId = this.editMatchId()
    if (matchId === undefined) return
    this.routeMatchId.set(matchId)
    this.savedId.set(matchId)
    this.pageLoadState.set('loading')
    try {
      const draft = await firstValueFrom(this.footballApi.loadEditorFootballDraft(matchId))
      this.model.set(footballFormFromDraft(draft))
      this.matchStatus.set(draft.status)
      this.pageLoadState.set('ready')
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.pageLoadState.set('not-found')
        return
      }
      this.pageLoadState.set('error')
    }
  }

  private editMatchId(): string | undefined {
    const fromParam = this.route.snapshot.paramMap.get('id')
    if (fromParam !== null) return fromParam
    const match = /^\/matches\/([^/]+)\/football/.exec(this.router.url)
    const fromUrl = match?.[1]
    if (fromUrl === undefined || fromUrl === 'new') return undefined
    return fromUrl
  }

  private async loadLookups(): Promise<void> {
    this.lookupStatus.set('loading')
    try {
      const [competitions, teams, athletes] = await Promise.all([
        firstValueFrom(this.workflowApi.editorCompetitions('football')),
        firstValueFrom(this.workflowApi.editorTeams()),
        firstValueFrom(this.workflowApi.editorAthletes('football')),
      ])
      this.competitions.set(competitionLookupSchema.array().parse(competitions))
      this.teams.set(teamLookupSchema.array().parse(teams))
      this.athletes.set(athleteLookupSchema.array().parse(athletes))
      this.lookupStatus.set('ready')
    } catch {
      this.lookupStatus.set('error')
      this.pageLoadState.set('error')
    }
  }

  private async save(): Promise<void> {
    if (this.footballForm().submitting()) return
    this.saveError.set(undefined)
    const matchId = this.activeMatchId()
    await submit(this.footballForm, {
      action: async () => {
        try {
          const body = buildFootballDraftBody(this.model(), matchId)
          const saved = this.isEditMode()
            ? await firstValueFrom(this.footballApi.updateFootballDraft(matchId, body))
            : await firstValueFrom(this.footballApi.createFootballDraft(body))
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
      const saved = await firstValueFrom(this.workflowApi.submitMatch(id))
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
