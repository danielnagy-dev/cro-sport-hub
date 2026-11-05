import { type PublicFootballResult } from '@cro-sport-hub/shared-types'
import { type AppearanceLine } from '@cro-sport-hub/ui'

/** Map public football `results` into the shape `AppearancesTable` already accepts. */
export function footballAppearanceLines(
  athleteId: string,
  results: readonly PublicFootballResult[],
): AppearanceLine[] {
  return results.map((result) => ({
    appearance: {
      matchId: result.id,
      athleteId,
      teamId: 'profile-club',
      started: result.started,
      minutes: result.minutes,
      goals: result.goals,
      assists: result.assists,
      yellowCards: result.yellowCards,
      redCard: result.redCard,
    },
    competition: {
      name: result.competition,
      season: result.date.slice(0, 4),
    },
    match: {
      date: result.date,
      round: result.round,
    },
  }))
}
