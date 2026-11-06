import type { FootballEntry } from './slides.ts'
import type { FootballPerson } from './football.ts'

/** One catalog appearance with the names and score the mapper needs. */
export type CatalogAppearance = {
  athleteName: string
  athletePosition?: string
  clubName: string
  competition: string
  round: string
  date: string
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  side: 'home' | 'away'
  started: boolean
  minutes: number
  goals: number
  assists: number
  yellowCards: number
  redCard: boolean
}

function cardText(yellowCards: number, redCard: boolean): string {
  if (yellowCards === 2) return 'Drugi žuti'
  if (yellowCards === 1 && !redCard) return 'Žuti'
  if (redCard && yellowCards !== 2) return 'Crveni'
  return 'Bez kartona'
}

function heroKey(goals: number, assists: number): FootballPerson['hero'] {
  if (goals > 0) return 'goals'
  if (assists > 0) return 'assists'
  return 'none'
}

function mapAppearance(row: CatalogAppearance): FootballEntry {
  const player: FootballPerson = {
    name: row.athleteName,
    club: row.clubName,
    fixture: {
      home: row.homeTeam,
      away: row.awayTeam,
      homeScore: row.homeGoals,
      awayScore: row.awayGoals,
      side: row.side,
    },
    stats: [
      { key: 'goals', label: 'GOLOVI', value: String(row.goals) },
      { key: 'assists', label: 'ASIST.', value: String(row.assists) },
      { key: 'minutes', label: 'MINUTE', value: String(row.minutes) },
      { key: 'cards', label: 'KARTONI', value: cardText(row.yellowCards, row.redCard) },
    ],
    hero: heroKey(row.goals, row.assists),
    lineup: row.started ? 'start' : 'sub',
  }
  if (row.athletePosition !== undefined && row.athletePosition !== '')
    player.position = row.athletePosition
  return {
    competition: row.competition,
    round: row.round,
    date: row.date,
    player,
  }
}

/** Maps catalog appearances to slide entries. Callers pass the result to `footballSlides`. */
export function catalogSlides(appearances: readonly CatalogAppearance[]): FootballEntry[] {
  return appearances.map(mapAppearance)
}
