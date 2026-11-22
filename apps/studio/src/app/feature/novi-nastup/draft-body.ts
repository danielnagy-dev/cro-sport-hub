import {
  idSchema,
  sportSlugSchema,
  textSchema,
  type FieldIssue,
  type SportSlug,
} from '@cro-sport-hub/shared-types'
import type { AppearanceWriteBody, LineupWriteBody } from '../../core/appearances-api'

export type ParticipantKind = 'athlete' | 'national-team'
export type NoviNastupFormModel = {
  sportSlug: SportSlug | ''
  competitionId: string
  opponentLabel: string
  startsAtLocal: string
  participantKind: ParticipantKind
  athleteId: string
  nationalTeamId: string
  lineupCsv: string
}

export const SPORT_IDS = {
  tennis: 'sport-tennis',
  football: 'sport-football',
  basketball: 'sport-basketball',
} as const satisfies Record<SportSlug, string>
export const NATIONAL_TEAMS = [
  { id: 'nt-croatia-football', sportSlug: 'football' as const, name: 'Sample Croatia Football' },
  {
    id: 'nt-croatia-basketball',
    sportSlug: 'basketball' as const,
    name: 'Sample Croatia Basketball',
  },
]

export function initialNoviNastupForm(): NoviNastupFormModel {
  return {
    sportSlug: '',
    competitionId: '',
    opponentLabel: '',
    startsAtLocal: '',
    participantKind: 'athlete',
    athleteId: '',
    nationalTeamId: '',
    lineupCsv: '',
  }
}

export function newAppearanceId(): string {
  return `appearance-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`
}

export function visibleFieldIds(sportSlug: SportSlug | ''): readonly string[] {
  const shared = ['sportSlug', 'competitionId', 'opponentLabel', 'startsAtLocal'] as const
  if (sportSlug === 'tennis') return [...shared, 'athleteId']
  if (sportSlug === 'football' || sportSlug === 'basketball') {
    return [...shared, 'participantKind', 'athleteId', 'nationalTeamId', 'lineupCsv']
  }
  return shared
}

export function showsAthleteSelect(model: NoviNastupFormModel): boolean {
  return model.sportSlug === 'tennis' || model.participantKind === 'athlete'
}

export function showsNationalTeamSelect(model: NoviNastupFormModel): boolean {
  return (
    (model.sportSlug === 'football' || model.sportSlug === 'basketball') &&
    model.participantKind === 'national-team'
  )
}

export function startsAtFromLocal(local: string): string | undefined {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) ? `${local}:00.000Z` : undefined
}

export function validateNoviNastup(model: NoviNastupFormModel): readonly FieldIssue[] {
  const sport = sportSlugSchema.safeParse(model.sportSlug)
  if (!sport.success) return [{ path: ['sportSlug'], message: 'Choose a sport' }]
  const issues: FieldIssue[] = []
  if (!idSchema.safeParse(model.competitionId).success) {
    issues.push({ path: ['competitionId'], message: 'Choose a competition' })
  }
  if (!textSchema(120).safeParse(model.opponentLabel).success) {
    issues.push({ path: ['opponentLabel'], message: 'Enter an opponent label' })
  }
  if (startsAtFromLocal(model.startsAtLocal) === undefined) {
    issues.push({ path: ['startsAtLocal'], message: 'Enter a start date and time' })
  }
  const athleteOk = sport.data === 'tennis' || model.participantKind === 'athlete'
  if (athleteOk && !idSchema.safeParse(model.athleteId).success) {
    issues.push({ path: ['athleteId'], message: 'Choose an athlete' })
  }
  if (!athleteOk && !idSchema.safeParse(model.nationalTeamId).success) {
    issues.push({ path: ['nationalTeamId'], message: 'Choose a national team' })
  }
  return issues
}

export function buildAppearanceBody(
  model: NoviNastupFormModel,
  id: string,
): AppearanceWriteBody | undefined {
  if (validateNoviNastup(model).length > 0) return undefined
  const sportSlug = sportSlugSchema.parse(model.sportSlug)
  const startsAt = startsAtFromLocal(model.startsAtLocal)
  if (startsAt === undefined) return undefined
  const base: AppearanceWriteBody = {
    id,
    sportId: SPORT_IDS[sportSlug],
    sportSlug,
    competitionId: model.competitionId,
    opponentLabel: model.opponentLabel,
    startsAt,
    status: 'scheduled',
    creatorKind: 'manual',
  }
  if (sportSlug === 'tennis' || model.participantKind === 'athlete') {
    return { ...base, athleteId: model.athleteId, athleteSport: sportSlug }
  }
  return { ...base, nationalTeamId: model.nationalTeamId }
}

export function buildLineupBodies(model: NoviNastupFormModel): readonly LineupWriteBody[] {
  if (!showsNationalTeamSelect(model)) return []
  const sportSlug = sportSlugSchema.parse(model.sportSlug)
  return model.lineupCsv
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((athleteId) => ({ athleteId, athleteSport: sportSlug, started: true, stats: {} }))
}
