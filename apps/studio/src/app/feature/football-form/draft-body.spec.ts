import { expect } from 'vite-plus/test'
import {
  buildFootballDraftBody,
  initialFootballFormModel,
  validateFootballDraft,
  type AppearanceRowModel,
  type FootballFormModel,
} from './draft-body'

const matchId = 'match-draft-test'
const score: FootballFormModel = {
  ...initialFootballFormModel(),
  competitionId: 'comp-sample-league',
  date: '2026-10-20',
  round: 'Matchday 11',
  homeTeamId: 'club-sample-home',
  awayTeamId: 'club-sample-away',
  homeGoals: '1',
  awayGoals: '0',
}

function appearance(overrides: Partial<AppearanceRowModel> = {}): AppearanceRowModel {
  return {
    athleteId: 'athlete-karlo',
    teamId: 'club-sample-home',
    started: true,
    minutes: '90',
    goals: '1',
    assists: '0',
    yellowCards: '0',
    redCard: false,
    ...overrides,
  }
}

describe('football draft body', () => {
  it('omits appearances when there are no rows', () => {
    expect(buildFootballDraftBody(score, matchId)).not.toHaveProperty('appearances')
  })

  it('rejects zero minutes with a goal', () => {
    const issues = validateFootballDraft(
      { ...score, appearances: [appearance({ minutes: '0', goals: '1', started: false })] },
      matchId,
    )
    expect(issues.map((issue) => issue.message)).toContain(
      'A player with no minutes cannot have goals',
    )
  })

  it('rejects a repeated athlete', () => {
    const row = appearance()
    const issues = validateFootballDraft({ ...score, appearances: [row, { ...row }] }, matchId)
    expect(issues.map((issue) => issue.message)).toContain('Each athlete is listed once')
  })
})
