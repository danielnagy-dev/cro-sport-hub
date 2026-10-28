import type { FootballPerson, FootballSlide } from './football.ts'

/** Round-13 hard limit. A list slide throws above this. */
const listLimit = 6

/**
 * One tracked appearance in a round. A round is the list heading:
 * competition, round label, and date. Players in one round share that
 * heading and keep their own fixtures.
 */
export type FootballEntry = {
  competition: string
  round: string
  date: string
  player: FootballPerson
}

function roundKey(entry: FootballEntry): string {
  return `${entry.competition}\0${entry.round}\0${entry.date}`
}

function playerSlide(entry: FootballEntry): FootballSlide {
  return {
    kind: 'player',
    competition: entry.competition,
    round: entry.round,
    date: entry.date,
    player: entry.player,
  }
}

function listSlide(rows: readonly FootballEntry[]): FootballSlide {
  const head = rows[0]
  if (head === undefined) throw new Error('A list needs a player')
  return {
    kind: 'list',
    competition: head.competition,
    round: head.round,
    date: head.date,
    players: rows.map((row) => row.player),
  }
}

/**
 * A round of one appearance is a player slide. Two to six are one list.
 * A seventh starts another list. The leftover stays a list: it is the same
 * round, not a featured player. There is no cover slide.
 */
export function footballSlides(entries: readonly FootballEntry[]): FootballSlide[] {
  const groups = new Map<string, FootballEntry[]>()
  const order: string[] = []
  for (const entry of entries) {
    const key = roundKey(entry)
    const group = groups.get(key)
    if (group === undefined) {
      groups.set(key, [entry])
      order.push(key)
    } else group.push(entry)
  }
  const slides: FootballSlide[] = []
  for (const key of order) {
    const group = groups.get(key) ?? []
    const solo = group[0]
    if (solo === undefined) continue
    if (group.length === 1) {
      slides.push(playerSlide(solo))
      continue
    }
    for (let start = 0; start < group.length; start += listLimit) {
      slides.push(listSlide(group.slice(start, start + listLimit)))
    }
  }
  return slides
}
