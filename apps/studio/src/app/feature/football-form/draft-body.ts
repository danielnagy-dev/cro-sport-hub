import {
  footballMatchSchema,
  idSchema,
  isoDateSchema,
  roundSchema,
  type FieldIssue,
} from '@cro-sport-hub/shared-types'

export type FootballFormModel = {
  competitionId: string
  date: string
  round: string
  homeTeamId: string
  awayTeamId: string
  homeGoals: string
  awayGoals: string
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

export function buildFootballDraftBody(model: FootballFormModel, matchId: string) {
  return {
    id: matchId,
    competitionId: model.competitionId,
    date: model.date,
    round: model.round,
    homeTeamId: model.homeTeamId,
    awayTeamId: model.awayTeamId,
    homeGoals: parseGoals(model.homeGoals) ?? Number.NaN,
    awayGoals: parseGoals(model.awayGoals) ?? Number.NaN,
  }
}

function pushIssue(issues: FieldIssue[], path: string, message: string | undefined): void {
  if (!message || issues.some((issue) => issue.path[0] === path)) return
  issues.push({ path: [path], message })
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
    pushIssue(issues, path, message)
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
      if (key !== 'matchId' && typeof key === 'string') pushIssue(issues, key, issue.message)
    }
  }
  return issues
}
