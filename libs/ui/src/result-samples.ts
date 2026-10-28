import type { Appearance, TennisStatCounts } from '@cro-sport-hub/shared-types'
import type { AppearanceLine } from './appearances-table.tsx'

/** Counts behind the 60% / 66.7% story. Percentages are not stored here. */
export const playedCounts: TennisStatCounts = {
  aces: 3,
  doubleFaults: 1,
  firstServeIn: 6,
  firstServeTotal: 10,
  firstServePointsWon: 4,
  secondServePointsWon: 2,
  secondServeTotal: 4,
  breakPointsSaved: 1,
  breakPointsFaced: 2,
  breakPointsWon: 2,
  breakPointsTotal: 4,
  totalPointsWon: 20,
}

/** First serve is 0%. Points won on that serve, and both break-point rates, had no attempts. */
export const zeroDenominatorCounts: TennisStatCounts = {
  ...playedCounts,
  aces: 0,
  doubleFaults: 0,
  firstServeIn: 0,
  firstServeTotal: 4,
  firstServePointsWon: 0,
  secondServePointsWon: 0,
  secondServeTotal: 4,
  breakPointsSaved: 0,
  breakPointsFaced: 0,
  breakPointsWon: 0,
  breakPointsTotal: 0,
  totalPointsWon: 0,
}

function appearanceLine(
  overrides: Partial<Appearance>,
  round: string,
  date: string,
): AppearanceLine {
  return {
    appearance: {
      matchId: 'match-1',
      athleteId: 'athlete-1',
      teamId: 'team-1',
      started: true,
      minutes: 90,
      goals: 1,
      assists: 0,
      yellowCards: 0,
      redCard: false,
      ...overrides,
    },
    competition: { name: 'Sample Cup', season: '2026' },
    match: { date, round },
  }
}

export const appearanceRows: readonly AppearanceLine[] = [
  appearanceLine({ matchId: 'match-1', yellowCards: 1 }, 'QF', '2026-05-01'),
  appearanceLine(
    {
      matchId: 'match-2',
      started: false,
      minutes: 12,
      goals: 0,
      assists: 1,
      yellowCards: 2,
      redCard: true,
    },
    'Final',
    '2026-05-20',
  ),
  appearanceLine({ matchId: 'match-3', minutes: 80, goals: 0, redCard: true }, 'SF', '2026-05-10'),
  appearanceLine(
    { matchId: 'match-4', yellowCards: 1, redCard: true, goals: 0 },
    'R16',
    '2026-04-28',
  ),
  appearanceLine({ matchId: 'match-5', started: false, minutes: 0, goals: 0 }, 'R32', '2026-04-20'),
]
