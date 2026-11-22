import { basketballSlides } from './basketball.ts'
import {
  footballTemplate,
  type FootballDocument,
  type FootballOptions,
  type FootballPerson,
} from './football.ts'
import type { MvpSlideDocument } from './mvp-slide.ts'
import { footballSlides, type FootballEntry } from './slides.ts'
import { tennisSlides } from './tennis.ts'
import { renderFootballPngs, renderHtmlPngs } from './render.ts'

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

export type AppearanceSportSlug = 'football' | 'tennis' | 'basketball'

/** Ordered appearance rows plus the sport that selects the template. */
export type AppearanceSlidePayload = {
  sportSlug: AppearanceSportSlug
  appearances: readonly AppearanceSlideInput[]
}

export type FootballAppearanceDocument = FootballDocument & { sportSlug: 'football' }

/** HTML slide documents from `slidesFromAppearance`. */
export type AppearanceSlideDocument = FootballAppearanceDocument | MvpSlideDocument

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

function footballDocuments(
  appearances: readonly AppearanceSlideInput[],
  options?: FootballOptions,
): FootballAppearanceDocument[] {
  return footballSlides(appearanceEntries(appearances)).map((slide) => ({
    ...footballTemplate(slide, options),
    sportSlug: 'football',
  }))
}

/**
 * HTML documents (and measured heroes/zoom for football) for N slides from an
 * appearance payload. Callers do not construct a gallery entity.
 */
export function slidesFromAppearance(
  payload: AppearanceSlidePayload,
  options?: FootballOptions,
): AppearanceSlideDocument[] {
  switch (payload.sportSlug) {
    case 'football':
      return footballDocuments(payload.appearances, options)
    case 'tennis':
      return tennisSlides(payload.appearances)
    case 'basketball':
      return basketballSlides(payload.appearances)
    default: {
      const unknown: never = payload.sportSlug
      throw new Error(`Unknown sport: ${String(unknown)}`)
    }
  }
}

/**
 * PNG bytes for those slides. An empty payload returns no bytes and does not
 * launch Chromium.
 */
export async function renderAppearancePngs(
  payload: AppearanceSlidePayload,
  options?: FootballOptions,
): Promise<Uint8Array[]> {
  if (payload.appearances.length === 0) return []
  switch (payload.sportSlug) {
    case 'football':
      return renderFootballPngs(footballSlides(appearanceEntries(payload.appearances)), options)
    case 'tennis':
    case 'basketball':
      return renderHtmlPngs(slidesFromAppearance(payload).map((doc) => doc.html))
    default: {
      const unknown: never = payload.sportSlug
      throw new Error(`Unknown sport: ${String(unknown)}`)
    }
  }
}
