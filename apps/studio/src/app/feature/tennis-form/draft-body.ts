import {
  idSchema,
  isoDateSchema,
  roundSchema,
  tennisBestOfSchema,
  tennisMatchSchema,
  type FieldIssue,
} from '@cro-sport-hub/shared-types'

export type SetRow = { gamesA: string; gamesB: string; tiebreak: string }

export type TennisDraftBody = {
  id: string
  competitionId: string
  date: string
  round: string
  playerAId: string
  playerBId: string
  winnerId: string
  bestOf: number
  score: number[][]
  retired?: true
}

export type TennisFormModel = {
  competitionId: string
  date: string
  round: string
  playerAId: string
  playerBId: string
  winnerId: string
  bestOf: string
  retired: boolean
  sets: SetRow[]
}

const setCount = 5

function emptySetRow(): SetRow {
  return { gamesA: '', gamesB: '', tiebreak: '' }
}

export function initialTennisFormModel(): TennisFormModel {
  return {
    competitionId: '',
    date: '',
    round: '',
    playerAId: '',
    playerBId: '',
    winnerId: '',
    bestOf: '3',
    retired: false,
    sets: Array.from({ length: setCount }, emptySetRow),
  }
}

export function newMatchId(): string {
  const raw = crypto.randomUUID().replaceAll('-', '')
  return `match-${raw.slice(0, 24)}`
}

function parseGames(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : Number.NaN
}

export function buildScore(sets: readonly SetRow[]): number[][] {
  const score: number[][] = []
  for (const row of sets) {
    const gamesA = parseGames(row.gamesA)
    const gamesB = parseGames(row.gamesB)
    if (gamesA === undefined && gamesB === undefined) continue
    if (gamesA === undefined || gamesB === undefined) {
      score.push([Number.NaN, Number.NaN])
      continue
    }
    if (row.tiebreak.trim() === '') {
      score.push([gamesA, gamesB])
      continue
    }
    const tiebreak = parseGames(row.tiebreak)
    if (tiebreak === undefined || Number.isNaN(tiebreak)) {
      score.push([gamesA, gamesB, Number.NaN])
      continue
    }
    score.push([gamesA, gamesB, tiebreak])
  }
  return score
}

export function buildTennisDraftBody(model: TennisFormModel, matchId: string): TennisDraftBody {
  const bestOf = Number(model.bestOf)
  const body: TennisDraftBody = {
    id: matchId,
    competitionId: model.competitionId,
    date: model.date,
    round: model.round,
    playerAId: model.playerAId,
    playerBId: model.playerBId,
    winnerId: model.winnerId,
    bestOf,
    score: buildScore(model.sets),
  }
  if (model.retired) body.retired = true
  return body
}

function pushIssue(issues: FieldIssue[], path: string, message: string | undefined): void {
  if (message === undefined || message.length === 0) return
  if (issues.some((issue) => issue.path[0] === path)) return
  issues.push({ path: [path], message })
}

export function validateTennisDraft(
  model: TennisFormModel,
  matchId: string,
): readonly FieldIssue[] {
  const issues: FieldIssue[] = []
  const body = buildTennisDraftBody(model, matchId)

  pushIssue(
    issues,
    'competitionId',
    idSchema.safeParse(body.competitionId).error?.issues[0]?.message,
  )
  pushIssue(issues, 'date', isoDateSchema.safeParse(body.date).error?.issues[0]?.message)
  pushIssue(issues, 'round', roundSchema.safeParse(body.round).error?.issues[0]?.message)
  pushIssue(issues, 'playerAId', idSchema.safeParse(body.playerAId).error?.issues[0]?.message)
  pushIssue(issues, 'playerBId', idSchema.safeParse(body.playerBId).error?.issues[0]?.message)
  pushIssue(issues, 'winnerId', idSchema.safeParse(body.winnerId).error?.issues[0]?.message)

  const bestOf = tennisBestOfSchema.safeParse(body.bestOf)
  if (!bestOf.success) {
    pushIssue(issues, 'bestOf', bestOf.error.issues[0]?.message)
  }

  const tennis = tennisMatchSchema.safeParse({
    matchId,
    playerAId: body.playerAId,
    playerBId: body.playerBId,
    winnerId: body.winnerId,
    bestOf: body.bestOf,
    score: body.score,
    ...(model.retired ? { retired: true } : {}),
  })
  if (!tennis.success) {
    for (const issue of tennis.error.issues) {
      const key = issue.path[0]
      if (key === 'matchId') continue
      if (typeof key === 'string') pushIssue(issues, key, issue.message)
    }
  }

  return issues
}
