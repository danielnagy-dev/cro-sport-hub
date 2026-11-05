import { expect } from 'vite-plus/test'
import {
  buildTennisDraftBody,
  initialTennisFormModel,
  validateTennisDraft,
} from './draft-body'

const matchId = 'match-draft-test'

function filledModel(overrides: Partial<ReturnType<typeof initialTennisFormModel>> = {}) {
  const model = initialTennisFormModel()
  return {
    ...model,
    competitionId: 'comp-sample-cup',
    date: '2026-10-20',
    round: 'Final',
    playerAId: 'sample-player-a',
    playerBId: 'sample-player-b',
    winnerId: 'sample-player-a',
    ...overrides,
  }
}

describe('validateTennisDraft', () => {
  it('reports shared-schema messages for an empty model', () => {
    const issues = validateTennisDraft(initialTennisFormModel(), matchId)
    expect(issues.some((issue) => issue.path[0] === 'competitionId')).toBe(true)
    expect(issues.map((issue) => issue.message)).toContain(
      'Expected an id of 1–64 letters, digits, underscores, or hyphens',
    )
  })

  it('builds a valid best-of-3 final without stats, status, or retired', () => {
    const model = filledModel({
      sets: initialTennisFormModel().sets.map((row, index) => {
        if (index === 0) return { gamesA: '6', gamesB: '4', tiebreak: '' }
        if (index === 1) return { gamesA: '6', gamesB: '3', tiebreak: '' }
        return row
      }),
    })
    expect(validateTennisDraft(model, matchId)).toEqual([])
    const body = buildTennisDraftBody(model, matchId)
    expect(body).toMatchObject({
      id: matchId,
      bestOf: 3,
      score: [
        [6, 4],
        [6, 3],
      ],
    })
    expect('status' in body).toBe(false)
    expect('stats' in body).toBe(false)
    expect(body.retired).toBeUndefined()
  })

  it('requires tiebreak points on a 7-6 set', () => {
    const model = filledModel({
      sets: initialTennisFormModel().sets.map((row, index) => {
        if (index === 0) return { gamesA: '7', gamesB: '6', tiebreak: '' }
        if (index === 1) return { gamesA: '6', gamesB: '3', tiebreak: '' }
        return row
      }),
    })
    const issues = validateTennisDraft(model, matchId)
    expect(issues.some((issue) => issue.path[0] === 'score')).toBe(true)
    expect(issues.map((issue) => issue.message)).toContain(
      'A 7-6 set needs the tiebreak points scored by the player who lost the set',
    )
  })
})

function validStatStrings(overrides: Partial<Record<string, string>> = {}) {
  return {
    aces: '3',
    doubleFaults: '1',
    firstServeIn: '6',
    firstServeTotal: '10',
    firstServePointsWon: '4',
    secondServePointsWon: '2',
    secondServeTotal: '4',
    breakPointsSaved: '1',
    breakPointsFaced: '2',
    breakPointsWon: '2',
    breakPointsTotal: '4',
    totalPointsWon: '20',
    ...overrides,
  }
}

describe('tennis draft stats', () => {
  it('posts raw counts for both players and never a percentage field', () => {
    const model = filledModel({
      sets: initialTennisFormModel().sets.map((row, index) => {
        if (index === 0) return { gamesA: '6', gamesB: '4', tiebreak: '' }
        if (index === 1) return { gamesA: '6', gamesB: '3', tiebreak: '' }
        return row
      }),
      playerAStats: validStatStrings(),
      playerBStats: validStatStrings({ aces: '1' }),
    })
    expect(validateTennisDraft(model, matchId)).toEqual([])
    const body = buildTennisDraftBody(model, matchId)
    expect(body.stats).toHaveLength(2)
    const first = body.stats?.[0] as Record<string, unknown> | undefined
    expect(first?.['firstServePct']).toBeUndefined()
    expect(body.stats?.[0]?.firstServeIn).toBe(6)
    expect(body.stats?.[1]?.aces).toBe(1)
  })

  it('reports tennisStatIssues for inconsistent counts', () => {
    const issues = validateTennisDraft(
      filledModel({ playerAStats: validStatStrings({ firstServeIn: '11' }) }),
      matchId,
    )
    expect(issues.map((issue) => issue.message)).toContain(
      'First serves in cannot exceed first serves played',
    )
  })
})
