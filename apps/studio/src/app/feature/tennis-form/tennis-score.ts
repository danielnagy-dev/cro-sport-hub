import { Component, computed, inject, signal, afterNextRender } from '@angular/core'
import { form, FormField, disabled, readonly, submit, validate } from '@angular/forms/signals'
import { HttpErrorResponse } from '@angular/common/http'
import { ActivatedRoute, RouterLink, Router } from '@angular/router'
import {
  athleteLookupSchema,
  competitionLookupSchema,
  tennisPercentages,
  type AthleteLookup,
  type CompetitionLookup,
  type Status,
} from '@cro-sport-hub/shared-types'
import { firstValueFrom } from 'rxjs'
import { AuthStore } from '../../core/auth'
import { StudioApi } from '../../core/studio-api'
import {
  buildTennisDraftBody,
  initialTennisFormModel,
  isStatBlockEmpty,
  newMatchId,
  parseStatCounts,
  statCountKeys,
  statCountLabels,
  tennisFormFromDraft,
  validateTennisDraft,
  type TennisFormModel,
} from './draft-body'

type LookupState = 'loading' | 'ready' | 'error'
type MatchStatus = Status
type PageLoadState = 'loading' | 'ready' | 'not-found' | 'error'

const percentageRows = [
  ['First serve', 'firstServePct'],
  ['First-serve points won', 'firstServePointsWonPct'],
  ['Second-serve points won', 'secondServePointsWonPct'],
  ['Break points saved', 'breakPointsSavedPct'],
  ['Break points converted', 'breakPointsConvertedPct'],
] as const

@Component({
  selector: 'app-tennis-score',
  imports: [FormField, RouterLink],
  templateUrl: './tennis-score.html',
})
export class TennisScorePage {
  private readonly api = inject(StudioApi)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  protected readonly auth = inject(AuthStore)

  protected readonly routeMatchId = signal<string | undefined>(undefined)
  protected readonly isEditMode = computed(() => this.routeMatchId() !== undefined)
  protected readonly pageLoadState = signal<PageLoadState>('loading')

  protected readonly model = signal<TennisFormModel>(initialTennisFormModel())
  protected readonly competitions = signal<CompetitionLookup[]>([])
  protected readonly athletes = signal<AthleteLookup[]>([])
  protected readonly lookupStatus = signal<LookupState>('loading')
  protected readonly saveError = signal<string | undefined>(undefined)
  protected readonly submitError = signal<string | undefined>(undefined)
  protected readonly savedId = signal<string | undefined>(undefined)
  protected readonly matchStatus = signal<MatchStatus | undefined>(undefined)
  protected readonly submitAttempted = signal(false)
  protected readonly submittingForReview = signal(false)
  protected readonly draftMatchId = newMatchId()
  protected readonly activeMatchId = computed(() => this.routeMatchId() ?? this.draftMatchId)

  protected readonly statBlockConfigs = [
    { block: 'playerAStats', legend: 'Player A stats (raw counts)', idPrefix: 'stat-a' },
    { block: 'playerBStats', legend: 'Player B stats (raw counts)', idPrefix: 'stat-b' },
  ] as const

  protected statFields(block: 'playerAStats' | 'playerBStats') {
    return block === 'playerAStats' ? this.tennisForm.playerAStats : this.tennisForm.playerBStats
  }

  protected readonly statCountKeys = statCountKeys
  protected readonly statCountLabels = statCountLabels
  protected readonly percentageRows = percentageRows

  protected readonly draftIssues = computed(() =>
    validateTennisDraft(this.model(), this.activeMatchId()),
  )

  protected readonly tennisForm = form(this.model, (path) => {
    const locked = () => {
      if (this.isEditMode()) return this.matchStatus() !== 'draft'
      return this.savedId() !== undefined
    }
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
    for (const key of statCountKeys) {
      disabled(path.playerAStats[key], { when: locked })
      disabled(path.playerBStats[key], { when: locked })
    }
  })

  constructor() {
    void this.bootLookups()
    afterNextRender(() => {
      void this.bootDraft()
    })
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
      const draft = await firstValueFrom(this.api.loadEditorTennisDraft(matchId))
      this.model.set(tennisFormFromDraft(draft))
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

  protected fieldMessage(field: keyof TennisFormModel | 'score'): string | undefined {
    if (!this.submitAttempted()) {
      const tree = field === 'score' ? this.tennisForm.sets() : this.tennisForm[field]()
      if (!tree.touched()) return undefined
    }
    return this.draftIssues().find((issue) => issue.path[0] === field)?.message
  }

  protected showErrors(field: keyof TennisFormModel | 'score'): boolean {
    return this.fieldMessage(field) !== undefined
  }

  protected statMessages(block: 'playerAStats' | 'playerBStats'): readonly string[] {
    if (!this.submitAttempted()) return []
    return this.draftIssues()
      .filter((issue) => issue.path[0] === block)
      .map((issue) => issue.message)
  }

  protected showPlayerPercentages(block: 'playerAStats' | 'playerBStats'): boolean {
    const row = block === 'playerAStats' ? this.model().playerAStats : this.model().playerBStats
    return !isStatBlockEmpty(row)
  }

  protected formatPercentage(value: number | null): string {
    if (value === null) return 'No attempts'
    const tenths = Math.round(value * 10) / 10
    return `${Number.isInteger(tenths) ? String(tenths) : tenths.toFixed(1)}%`
  }

  protected percentageValue(
    block: 'playerAStats' | 'playerBStats',
    key: (typeof percentageRows)[number][1],
  ): string {
    const row = block === 'playerAStats' ? this.model().playerAStats : this.model().playerBStats
    const counts = parseStatCounts(row)
    if (counts === undefined) return 'No attempts'
    return this.formatPercentage(tennisPercentages(counts)[key])
  }

  protected setIndex(index: number): number {
    return index + 1
  }

  protected canSubmitForReview(): boolean {
    return this.matchStatus() === 'draft' && !this.submittingForReview()
  }

  protected onSubmit(event: Event): void {
    event.preventDefault()
    if (!this.isEditMode() && this.savedId() !== undefined) return
    if (this.isEditMode() && this.matchStatus() !== 'draft') return
    this.submitAttempted.set(true)
    this.tennisForm().markAsTouched()
    void this.send()
  }

  protected onSubmitForReview(): void {
    if (this.savedId() === undefined || this.matchStatus() !== 'draft') return
    void this.sendForReview()
  }

  private editMatchId(): string | undefined {
    const fromParam = this.route.snapshot.paramMap.get('id')
    if (fromParam !== null) return fromParam
    const match = /^\/matches\/([^/]+)\/tennis/.exec(this.router.url)
    const fromUrl = match?.[1]
    if (fromUrl === undefined || fromUrl === 'new') return undefined
    return fromUrl
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
      this.pageLoadState.set('error')
    }
  }

  private async send(): Promise<void> {
    if (this.tennisForm().submitting()) return
    if (this.draftIssues().length > 0) return
    this.saveError.set(undefined)
    const matchId = this.activeMatchId()
    const accepted = await submit(this.tennisForm, {
      action: async () => {
        const body = buildTennisDraftBody(this.model(), matchId)
        try {
          const saved = this.isEditMode()
            ? await firstValueFrom(this.api.updateTennisDraft(matchId, body))
            : await firstValueFrom(this.api.createTennisDraft(body))
          this.savedId.set(saved.id)
          this.matchStatus.set('draft')
          return undefined
        } catch {
          this.saveError.set('The tennis match could not be saved.')
          return undefined
        }
      },
    })
    if (!accepted || this.saveError() !== undefined) this.focusProblem()
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
