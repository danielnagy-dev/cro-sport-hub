import {
  footballTemplate,
  type FootballDocument,
  type FootballOptions,
  type FootballPerson,
} from './football.ts'
import { footballSlides, type FootballEntry } from './slides.ts'
import { renderFootballPngs } from './render.ts'

/**
 * One ordered appearance row the football template needs.
 * Sport-specific fields refine later (tennis / basketball).
 */
export type AppearanceSlideInput = {
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

/** Ordered appearance rows; slide count follows the football list rules. */
export type AppearanceSlidePayload = {
  appearances: readonly AppearanceSlideInput[]
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

function mapAppearance(row: AppearanceSlideInput): FootballEntry {
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

/** Maps appearance rows to football slide entries (gallery and appearance seams). */
export function appearanceEntries(appearances: readonly AppearanceSlideInput[]): FootballEntry[] {
  return appearances.map(mapAppearance)
}

/**
 * HTML documents (and measured heroes/zoom) for N slides from an appearance
 * payload. Callers do not construct a gallery entity.
 */
export function slidesFromAppearance(
  payload: AppearanceSlidePayload,
  options?: FootballOptions,
): FootballDocument[] {
  return footballSlides(appearanceEntries(payload.appearances)).map((slide) =>
    footballTemplate(slide, options),
  )
}

/**
 * PNG bytes for those slides. An empty payload returns no bytes and does not
 * launch Chromium.
 */
export async function renderAppearancePngs(
  payload: AppearanceSlidePayload,
  options?: FootballOptions,
): Promise<Uint8Array[]> {
  return renderFootballPngs(footballSlides(appearanceEntries(payload.appearances)), options)
}
