import type { AppearanceSlideInput } from '../src/index.ts'

const LEAGUE_META = {
  competition: 'Sample League',
  round: 'Matchday 8',
  date: '2026-10-19',
  homeTeam: 'Sample Home',
  awayTeam: 'Sample Away',
  homeGoals: 2,
  awayGoals: 1,
} as const

function appearance(
  athleteName: string,
  clubName: string,
  side: 'home' | 'away',
  started: boolean,
  minutes: number,
  goals: number,
  assists: number,
  yellowCards: number,
  redCard: boolean,
  athletePosition?: string,
): AppearanceSlideInput {
  return {
    athleteName,
    athletePosition,
    clubName,
    ...LEAGUE_META,
    side,
    started,
    minutes,
    goals,
    assists,
    yellowCards,
    redCard,
  }
}

export const leagueAppearances: readonly AppearanceSlideInput[] = [
  appearance('Karlo Brkić', 'Sample Home', 'home', true, 90, 2, 0, 0, false, 'Forward'),
  appearance('Mateo Jurčić', 'Sample Home', 'home', true, 75, 0, 1, 1, false, 'Midfielder'),
  appearance('Leon Vuković', 'Sample Home', 'home', true, 90, 0, 0, 0, false, 'Goalkeeper'),
  appearance('Filip Šarić', 'Sample Away', 'away', true, 90, 1, 0, 2, true, 'Right back'),
  appearance('Bruno Perić', 'Sample Away', 'away', false, 0, 0, 0, 1, false, 'Forward'),
]
