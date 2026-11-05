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

export type FootballDraftBody = {
  id: string
  competitionId: string
  date: string
  round: string
  homeTeamId: string
  awayTeamId: string
  homeGoals: number
  awayGoals: number
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
  const raw = crypto.randomUUID().replaceAll('-', '')
  return `match-${raw.slice(0, 24)}`
}

function parseGoals(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return Number.NaN
  return parsed
}

export function buildFootballDraftBody(
  model: FootballFormModel,
  matchId: string,
): FootballDraftBody {
  const homeGoals = parseGoals(model.homeGoals)
  const awayGoals = parseGoals(model.awayGoals)
  return {
    id: matchId,
    competitionId: model.competitionId,
    date: model.date,
    round: model.round,
    homeTeamId: model.homeTeamId,
    awayTeamId: model.awayTeamId,
    homeGoals: homeGoals ?? Number.NaN,
    awayGoals: awayGoals ?? Number.NaN,
  }
}

function pushIssue(issues: FieldIssue[], path: string, message: string | undefined): void {
  if (message === undefined || message.length === 0) return
  if (issues.some((issue) => issue.path[0] === path)) return
  issues.push({ path: [path], message })
}

function goalIssue(value: string, parsed: number | undefined): string | undefined {
  if (value.trim() === '') return 'Invalid input: expected number, received NaN'
  if (parsed === undefined || Number.isNaN(parsed)) {
    return 'Invalid input: expected number, received NaN'
  }
  return undefined
}

export function validateFootballDraft(
  model: FootballFormModel,
  matchId: string,
): readonly FieldIssue[] {
  const issues: FieldIssue[] = []
  const body = buildFootballDraftBody(model, matchId)

  pushIssue(
    issues,
    'competitionId',
    idSchema.safeParse(body.competitionId).error?.issues[0]?.message,
  )
  pushIssue(issues, 'date', isoDateSchema.safeParse(body.date).error?.issues[0]?.message)
  pushIssue(issues, 'round', roundSchema.safeParse(body.round).error?.issues[0]?.message)
  pushIssue(issues, 'homeTeamId', idSchema.safeParse(body.homeTeamId).error?.issues[0]?.message)
  pushIssue(issues, 'awayTeamId', idSchema.safeParse(body.awayTeamId).error?.issues[0]?.message)

  const homeParsed = parseGoals(model.homeGoals)
  const awayParsed = parseGoals(model.awayGoals)
  pushIssue(issues, 'homeGoals', goalIssue(model.homeGoals, homeParsed))
  pushIssue(issues, 'awayGoals', goalIssue(model.awayGoals, awayParsed))

  const football = footballMatchSchema.safeParse({
    matchId,
    homeTeamId: body.homeTeamId,
    awayTeamId: body.awayTeamId,
    homeGoals: homeParsed ?? Number.NaN,
    awayGoals: awayParsed ?? Number.NaN,
  })
  if (!football.success) {
    for (const issue of football.error.issues) {
      const key = issue.path[0]
      if (key === 'matchId') continue
      if (typeof key === 'string') pushIssue(issues, key, issue.message)
    }
  }

  return issues
}
