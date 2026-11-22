import { HttpErrorResponse } from '@angular/common/http'
import { Component, computed, inject, signal } from '@angular/core'
import { form, FormField } from '@angular/forms/signals'
import {
  type AthleteLookup,
  type CompetitionLookup,
  type SportSlug,
  sportSlugSchema,
} from '@cro-sport-hub/shared-types'
import { firstValueFrom } from 'rxjs'
import { AppearancesApi, type EditorAppearance } from '../../core/appearances-api'
import { EditorLookupsApi } from '../../core/editor-lookups-api'
import { StudioSectionHeader } from '../../core/studio-section-header'
import {
  buildAppearanceBody,
  buildLineupBodies,
  initialNoviNastupForm,
  NATIONAL_TEAMS,
  newAppearanceId,
  showsAthleteSelect,
  showsNationalTeamSelect,
  type NoviNastupFormModel,
  type ParticipantKind,
} from './draft-body'

const SPORTS = ['tennis', 'football', 'basketball'] as const satisfies readonly SportSlug[]

@Component({
  selector: 'app-novi-nastup',
  imports: [FormField, StudioSectionHeader],
  templateUrl: './novi-nastup.html',
})
export class NoviNastupPage {
  private readonly appearances = inject(AppearancesApi)
  private readonly lookups = inject(EditorLookupsApi)
  protected readonly model = signal<NoviNastupFormModel>(initialNoviNastupForm())
  protected readonly competitions = signal<CompetitionLookup[]>([])
  protected readonly athletes = signal<AthleteLookup[]>([])
  protected readonly listed = signal<EditorAppearance[]>([])
  protected readonly saveError = signal<string | undefined>(undefined)
  protected readonly savedId = signal<string | undefined>(undefined)
  protected readonly saving = signal(false)
  protected readonly sports = SPORTS
  protected readonly noviForm = form(this.model)
  protected readonly sportSlug = computed(() => this.model().sportSlug)
  protected readonly teamParticipant = computed(() => {
    const sport = this.sportSlug()
    return sport === 'football' || sport === 'basketball'
  })
  protected readonly showAthlete = computed(() => showsAthleteSelect(this.model()))
  protected readonly showNationalTeam = computed(() => showsNationalTeamSelect(this.model()))
  protected readonly nationalTeams = computed(() =>
    NATIONAL_TEAMS.filter((row) => row.sportSlug === this.sportSlug()),
  )

  protected async onSportSelect(event: Event): Promise<void> {
    const target = event.target
    if (!(target instanceof HTMLSelectElement)) return
    const parsed = sportSlugSchema.safeParse(target.value)
    const sportSlug = parsed.success ? parsed.data : ''
    this.model.update((current) => ({
      ...initialNoviNastupForm(),
      sportSlug,
      participantKind: sportSlug === 'tennis' ? 'athlete' : current.participantKind,
    }))
    this.listed.set([])
    if (sportSlug === '') {
      this.competitions.set([])
      this.athletes.set([])
      return
    }
    try {
      const [competitions, athletes] = await Promise.all([
        firstValueFrom(this.lookups.editorCompetitions(sportSlug)),
        firstValueFrom(this.lookups.editorAthletes(sportSlug)),
      ])
      this.competitions.set(competitions)
      this.athletes.set(athletes)
    } catch {
      this.competitions.set([])
      this.athletes.set([])
    }
  }

  protected onParticipantKindSelect(event: Event): void {
    const target = event.target
    if (!(target instanceof HTMLSelectElement)) return
    const participantKind: ParticipantKind =
      target.value === 'national-team' ? 'national-team' : 'athlete'
    this.model.update((current) => ({
      ...current,
      participantKind,
      athleteId: '',
      nationalTeamId: '',
      lineupCsv: '',
    }))
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault()
    this.saveError.set(undefined)
    const body = buildAppearanceBody(this.model(), newAppearanceId())
    if (body === undefined) {
      this.saveError.set('Ispravite polja u obrascu.')
      return
    }
    this.saving.set(true)
    try {
      const created = await firstValueFrom(this.appearances.create(body))
      for (const lineup of buildLineupBodies(this.model())) {
        await firstValueFrom(this.appearances.createLineup(created.id, lineup))
      }
      this.savedId.set(created.id)
      await this.refreshList(created.startsAt.slice(0, 10), created.sportSlug)
    } catch (error) {
      this.saveError.set(httpMessage(error))
    } finally {
      this.saving.set(false)
    }
  }

  private async refreshList(day: string, sportSlug: SportSlug): Promise<void> {
    try {
      this.listed.set(await firstValueFrom(this.appearances.list({ day, sportSlug })))
    } catch {
      this.listed.set([])
    }
  }
}

function httpMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Spremanje nije uspjelo.'
  const message =
    typeof error.error === 'object' && error.error !== null && 'message' in error.error
      ? (error.error as { message: unknown }).message
      : undefined
  return typeof message === 'string' && message.length > 0
    ? message
    : `Spremanje nije uspjelo (${error.status}).`
}
