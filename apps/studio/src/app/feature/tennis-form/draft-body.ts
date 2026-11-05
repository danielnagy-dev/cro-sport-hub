import {
  idSchema,
  isoDateSchema,
  roundSchema,
  tennisBestOfSchema,
  tennisMatchSchema,
  tennisStatIssues,
  type EditorTennisDraft,
  type FieldIssue,
  type TennisStatCounts,
} from '@cro-sport-hub/shared-types'

export type SetRow = { gamesA: string; gamesB: string; tiebreak: string }

export type StatCountModel = {
  [Key in keyof TennisStatCounts]: string
}

export type TennisDraftStat = TennisStatCounts & { athleteId: string }

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
  stats?: TennisDraftStat[]
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
  playerAStats: StatCountModel
  playerBStats: StatCountModel
}

export const statCountKeys = [
  'aces',
  'doubleFaults',
  'firstServeIn',
  'firstServeTotal',
  'firstServePointsWon',
  'secondServePointsWon',
  'secondServeTotal',
  'breakPointsSaved',
  'breakPointsFaced',
  'breakPointsWon',
  'breakPointsTotal',
  'totalPointsWon',
] as const satisfies readonly (keyof TennisStatCounts)[]

export const statCountLabels: Record<keyof TennisStatCounts, string> = {
  aces: 'Aces',
  doubleFaults: 'Double faults',
  firstServeIn: 'First serves in',
  firstServeTotal: 'First serves played',
  firstServePointsWon: 'First-serve points won',
  secondServePointsWon: 'Second-serve points won',
  secondServeTotal: 'Second serves played',
  breakPointsSaved: 'Break points saved',
  breakPointsFaced: 'Break points faced',
  breakPointsWon: 'Break points won',
  breakPointsTotal: 'Break points played',
  totalPointsWon: 'Total points won',
}

const setCount = 5

function emptySetRow(): SetRow {
  return { gamesA: '', gamesB: '', tiebreak: '' }
}

function emptyStatRow(): StatCountModel {
  return Object.fromEntries(statCountKeys.map((key) => [key, ''])) as StatCountModel
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
    playerAStats: emptyStatRow(),
    playerBStats: emptyStatRow(),
  }
}

function statRowFromCounts(counts: TennisStatCounts): StatCountModel {
  return Object.fromEntries(
    statCountKeys.map((key) => [key, String(counts[key])]),
  ) as StatCountModel
}

function setsFromScore(score: EditorTennisDraft['score']): SetRow[] {
  const rows = Array.from({ length: setCount }, emptySetRow)
  for (const [index, set] of score.entries()) {
    if (index >= setCount) break
    rows[index] = {
      gamesA: String(set[0]),
      gamesB: String(set[1]),
      tiebreak: set.length > 2 ? String(set[2]) : '',
    }
  }
  return rows
}

/** Maps an editor GET body into the signal form model. */
export function tennisFormFromDraft(draft: EditorTennisDraft): TennisFormModel {
  const stats = draft.stats ?? []
  const statsFor = (athleteId: string): StatCountModel => {
    const row = stats.find((entry) => entry.athleteId === athleteId)
    return row === undefined ? emptyStatRow() : statRowFromCounts(row)
  }
  return {
    competitionId: draft.competitionId,
    date: draft.date,
    round: draft.round,
    playerAId: draft.playerAId,
    playerBId: draft.playerBId,
    winnerId: draft.winnerId,
    bestOf: String(draft.bestOf),
    retired: draft.retired === true,
    sets: setsFromScore(draft.score),
    playerAStats: statsFor(draft.playerAId),
    playerBStats: statsFor(draft.playerBId),
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

function parseCount(value: string): number | undefined {
  if (value.trim() === '') return 0
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}

export function isStatBlockEmpty(row: StatCountModel): boolean {
  return statCountKeys.every((key) => row[key].trim() === '')
}

export function parseStatCounts(row: StatCountModel): TennisStatCounts | undefined {
  if (isStatBlockEmpty(row)) return undefined
  const counts = {} as TennisStatCounts
  for (const key of statCountKeys) {
    const parsed = parseCount(row[key])
    if (parsed === undefined) return undefined
    counts[key] = parsed
  }
  return counts
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

function buildStatEntry(row: StatCountModel, athleteId: string): TennisDraftStat | undefined {
  const counts = parseStatCounts(row)
  if (counts === undefined || athleteId.trim() === '') return undefined
  return { athleteId, ...counts }
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
  const stats = [
    buildStatEntry(model.playerAStats, model.playerAId),
    buildStatEntry(model.playerBStats, model.playerBId),
  ].filter((entry): entry is TennisDraftStat => entry !== undefined)
  if (stats.length > 0) body.stats = stats
  return body
}

function pushIssue(issues: FieldIssue[], path: string, message: string | undefined): void {
  if (message === undefined || message.length === 0) return
  if (issues.some((issue) => issue.path[0] === path)) return
  issues.push({ path: [path], message })
}

function statIssuesForPlayer(
  row: StatCountModel,
  athleteId: string,
  block: 'playerAStats' | 'playerBStats',
): readonly FieldIssue[] {
  if (isStatBlockEmpty(row)) return []
  if (idSchema.safeParse(athleteId).success === false) {
    return [{ path: [block], message: 'Choose the player before entering stats' }]
  }
  const counts = parseStatCounts(row)
  if (counts === undefined) {
    return [{ path: [block], message: 'Stat counts must be whole numbers from 0 upward' }]
  }
  return tennisStatIssues(counts).map((issue) => ({
    path: [block, ...issue.path],
    message: issue.message,
  }))
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

  for (const issue of statIssuesForPlayer(model.playerAStats, model.playerAId, 'playerAStats')) {
    issues.push(issue)
  }
  for (const issue of statIssuesForPlayer(model.playerBStats, model.playerBId, 'playerBStats')) {
    issues.push(issue)
  }

  return issues
}
