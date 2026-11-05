import {
  appearanceSchema,
  footballMatchSchema,
  idSchema,
  isoDateSchema,
  roundSchema,
  type Appearance,
  type EditorFootballDraft,
  type FieldIssue,
} from '@cro-sport-hub/shared-types'

export type AppearanceRowModel = {
  athleteId: string
  teamId: string
  started: boolean
  minutes: string
  goals: string
  assists: string
  yellowCards: string
  redCard: boolean
}

export type FootballFormModel = {
  competitionId: string
  date: string
  round: string
  homeTeamId: string
  awayTeamId: string
  homeGoals: string
  awayGoals: string
  appearances: AppearanceRowModel[]
}

export function emptyAppearanceRow(): AppearanceRowModel {
  return {
    athleteId: '',
    teamId: '',
    started: false,
    minutes: '',
    goals: '',
    assists: '',
    yellowCards: '',
    redCard: false,
  }
}

export function initialFootballFormModel(): FootballFormModel {
  return {
    competitionId: '',
    date: '',
    round: '',
    homeTeamId: '',
    awayTeamId: '',
    homeGoals: '',
    awayGoals: '',
    appearances: [],
  }
}

function appearanceRowFromDraft(row: Omit<Appearance, 'matchId'>): AppearanceRowModel {
  return {
    athleteId: row.athleteId,
    teamId: row.teamId,
    started: row.started,
    minutes: String(row.minutes),
    goals: String(row.goals),
    assists: String(row.assists),
    yellowCards: String(row.yellowCards),
    redCard: row.redCard,
  }
}

/** Maps an editor GET body into the signal form model. */
export function footballFormFromDraft(draft: EditorFootballDraft): FootballFormModel {
  return {
    competitionId: draft.competitionId,
    date: draft.date,
    round: draft.round,
    homeTeamId: draft.homeTeamId,
    awayTeamId: draft.awayTeamId,
    homeGoals: String(draft.homeGoals),
    awayGoals: String(draft.awayGoals),
    appearances: (draft.appearances ?? []).map((row) => appearanceRowFromDraft(row)),
  }
}

export function newMatchId(): string {
  return `match-${crypto.randomUUID().replaceAll('-', '').slice(0, 24)}`
}

function parseGoals(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : Number.NaN
}

function parseCount(value: string): number | undefined {
  if (value.trim() === '') return 0
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}

function rowFilled(row: AppearanceRowModel): boolean {
  return row.athleteId.trim() !== ''
}

function parseAppearanceRow(row: AppearanceRowModel): Omit<Appearance, 'matchId'> | undefined {
  if (!rowFilled(row)) return undefined
  const minutes = parseCount(row.minutes)
  const goals = parseCount(row.goals)
  const assists = parseCount(row.assists)
  const yellowCards = parseCount(row.yellowCards)
  if (
    minutes === undefined ||
    goals === undefined ||
    assists === undefined ||
    yellowCards === undefined
  ) {
    return undefined
  }
  return {
    athleteId: row.athleteId,
    teamId: row.teamId,
    started: row.started,
    minutes,
    goals,
    assists,
    yellowCards,
    redCard: row.redCard,
  }
}

export function buildFootballDraftBody(model: FootballFormModel, matchId: string) {
  const body = {
    id: matchId,
    competitionId: model.competitionId,
    date: model.date,
    round: model.round,
    homeTeamId: model.homeTeamId,
    awayTeamId: model.awayTeamId,
    homeGoals: parseGoals(model.homeGoals) ?? Number.NaN,
    awayGoals: parseGoals(model.awayGoals) ?? Number.NaN,
  } as {
    id: string
    competitionId: string
    date: string
    round: string
    homeTeamId: string
    awayTeamId: string
    homeGoals: number
    awayGoals: number
    appearances?: Omit<Appearance, 'matchId'>[]
  }
  const appearances = model.appearances
    .map((row) => parseAppearanceRow(row))
    .filter((row): row is Omit<Appearance, 'matchId'> => row !== undefined)
  if (appearances.length > 0) body.appearances = appearances
  return body
}

function pushIssue(
  issues: FieldIssue[],
  path: readonly string[],
  message: string | undefined,
): void {
  if (!message || issues.some((issue) => issue.path.join('.') === path.join('.'))) return
  issues.push({ path: [...path], message })
}

export function validateFootballDraft(
  model: FootballFormModel,
  matchId: string,
): readonly FieldIssue[] {
  const issues: FieldIssue[] = []
  const body = buildFootballDraftBody(model, matchId)
  const homeGoals = parseGoals(model.homeGoals)
  const awayGoals = parseGoals(model.awayGoals)
  for (const [path, message] of [
    ['competitionId', idSchema.safeParse(body.competitionId).error?.issues[0]?.message],
    ['date', isoDateSchema.safeParse(body.date).error?.issues[0]?.message],
    ['round', roundSchema.safeParse(body.round).error?.issues[0]?.message],
    ['homeTeamId', idSchema.safeParse(body.homeTeamId).error?.issues[0]?.message],
    ['awayTeamId', idSchema.safeParse(body.awayTeamId).error?.issues[0]?.message],
    [
      'homeGoals',
      model.homeGoals.trim() === '' || homeGoals === undefined || Number.isNaN(homeGoals)
        ? 'Invalid input: expected number, received NaN'
        : undefined,
    ],
    [
      'awayGoals',
      model.awayGoals.trim() === '' || awayGoals === undefined || Number.isNaN(awayGoals)
        ? 'Invalid input: expected number, received NaN'
        : undefined,
    ],
  ] as const) {
    pushIssue(issues, [path], message)
  }
  const football = footballMatchSchema.safeParse({
    matchId,
    homeTeamId: body.homeTeamId,
    awayTeamId: body.awayTeamId,
    homeGoals: homeGoals ?? Number.NaN,
    awayGoals: awayGoals ?? Number.NaN,
  })
  if (!football.success) {
    for (const issue of football.error.issues) {
      const key = issue.path[0]
      if (key !== 'matchId' && typeof key === 'string') pushIssue(issues, [key], issue.message)
    }
  }

  for (const [index, row] of model.appearances.entries()) {
    if (!rowFilled(row)) continue
    const parsed = parseAppearanceRow(row)
    const rowPath = ['appearances', String(index)] as const
    if (parsed === undefined) {
      pushIssue(issues, rowPath, 'Appearance counts must be whole numbers from 0 upward')
      continue
    }
    if (
      model.homeTeamId !== '' &&
      model.awayTeamId !== '' &&
      parsed.teamId !== model.homeTeamId &&
      parsed.teamId !== model.awayTeamId
    ) {
      pushIssue(issues, [...rowPath, 'teamId'], 'The appearance club is one of the two sides')
    }
    const checked = appearanceSchema.safeParse({ matchId, ...parsed })
    if (!checked.success) {
      for (const issue of checked.error.issues) {
        if (issue.path[0] === 'matchId') continue
        const field = issue.path[0]
        if (typeof field === 'string') pushIssue(issues, [...rowPath, field], issue.message)
      }
    }
  }

  const athleteIds = model.appearances.filter(rowFilled).map((row) => row.athleteId)
  if (new Set(athleteIds).size !== athleteIds.length) {
    pushIssue(issues, ['appearances'], 'Each athlete is listed once')
  }

  return issues
}
