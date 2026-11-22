import { expect, test } from 'vite-plus/test'
import {
  buildAppearanceBody,
  buildLineupBodies,
  initialNoviNastupForm,
  showsNationalTeamSelect,
  visibleFieldIds,
  type NoviNastupFormModel,
} from './draft-body'

function filled(overrides: Partial<NoviNastupFormModel> = {}): NoviNastupFormModel {
  return {
    ...initialNoviNastupForm(),
    sportSlug: 'tennis',
    competitionId: 'comp-sample-cup',
    opponentLabel: 'Sample Rival',
    startsAtLocal: '2026-11-22T15:00',
    athleteId: 'sample-player-a',
    ...overrides,
  }
}

test('sport-switch field branches', () => {
  expect(visibleFieldIds('tennis')).toContain('athleteId')
  expect(visibleFieldIds('tennis')).not.toContain('participantKind')
  expect(visibleFieldIds('football')).toContain('lineupCsv')
  expect(visibleFieldIds('basketball')).toContain('participantKind')
})

test('create body is manual; lineup optional for national team', () => {
  expect(buildAppearanceBody(filled(), 'appearance-a')).toMatchObject({
    creatorKind: 'manual',
    athleteId: 'sample-player-a',
  })
  const team = filled({
    sportSlug: 'football',
    competitionId: 'comp-sample-league',
    participantKind: 'national-team',
    athleteId: '',
    nationalTeamId: 'nt-croatia-football',
    lineupCsv: 'karlo-brkic',
  })
  expect(showsNationalTeamSelect(team)).toBe(true)
  expect(buildAppearanceBody(team, 'appearance-nt')?.creatorKind).toBe('manual')
  expect(buildLineupBodies(team)[0]?.athleteId).toBe('karlo-brkic')
})
