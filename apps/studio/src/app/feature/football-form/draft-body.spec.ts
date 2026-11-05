import { expect } from 'vite-plus/test'
import {
  buildFootballDraftBody,
  initialFootballFormModel,
  validateFootballDraft,
} from './draft-body'

const matchId = 'match-draft-test'

function filledModel(overrides: Partial<ReturnType<typeof initialFootballFormModel>> = {}) {
  return {
    ...initialFootballFormModel(),
    competitionId: 'comp-sample-league',
    date: '2026-10-20',
    round: 'Matchday 11',
    homeTeamId: 'club-sample-home',
    awayTeamId: 'club-sample-away',
    homeGoals: '1',
    awayGoals: '0',
    ...overrides,
  }
}

describe('validateFootballDraft', () => {
  it('reports shared-schema messages for an empty model', () => {
    const issues = validateFootballDraft(initialFootballFormModel(), matchId)
    expect(issues.some((issue) => issue.path[0] === 'competitionId')).toBe(true)
    expect(issues.map((issue) => issue.message)).toContain(
      'Expected an id of 1–64 letters, digits, underscores, or hyphens',
    )
  })

  it('builds a valid score without appearances or status', () => {
    const model = filledModel()
    expect(validateFootballDraft(model, matchId)).toEqual([])
    const body = buildFootballDraftBody(model, matchId)
    expect(body).toMatchObject({
      id: matchId,
      homeTeamId: 'club-sample-home',
      awayTeamId: 'club-sample-away',
      homeGoals: 1,
      awayGoals: 0,
    })
    expect('status' in body).toBe(false)
    expect('appearances' in body).toBe(false)
  })

  it('requires different home and away clubs', () => {
    const issues = validateFootballDraft(filledModel({ awayTeamId: 'club-sample-home' }), matchId)
    expect(issues.some((issue) => issue.path[0] === 'awayTeamId')).toBe(true)
    expect(issues.map((issue) => issue.message)).toContain('Home and away clubs must be different')
  })
})
