import { expect, test } from 'vite-plus/test'
import {
  catalogSlides,
  footballSlides,
  footballTemplate,
  type CatalogAppearance,
} from '../src/index.ts'

const leagueMeta = {
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
): CatalogAppearance {
  return {
    athleteName,
    athletePosition,
    clubName,
    ...leagueMeta,
    side,
    started,
    minutes,
    goals,
    assists,
    yellowCards,
    redCard,
  }
}

/** Seed order for `match-sample-league`. */
export const leagueAppearances: readonly CatalogAppearance[] = [
  appearance('Karlo Brkić', 'Sample Home', 'home', true, 90, 2, 0, 0, false, 'Forward'),
  appearance('Mateo Jurčić', 'Sample Home', 'home', true, 75, 0, 1, 1, false, 'Midfielder'),
  appearance('Leon Vuković', 'Sample Home', 'home', true, 90, 0, 0, 0, false, 'Goalkeeper'),
  appearance('Filip Šarić', 'Sample Away', 'away', true, 90, 1, 0, 2, true, 'Right back'),
  appearance('Bruno Perić', 'Sample Away', 'away', false, 0, 0, 0, 1, false, 'Forward'),
]

test('five league appearances split into four list rows then a one-row list slide', () => {
  const slides = footballSlides(catalogSlides(leagueAppearances))
  expect(slides.map((slide) => slide.kind)).toEqual(['list', 'list'])
  const listSlide = slides[0]
  const tailSlide = slides[1]
  expect(listSlide?.kind).toBe('list')
  if (listSlide?.kind !== 'list') return
  expect(listSlide.players).toHaveLength(4)
  expect(tailSlide?.kind).toBe('list')
  expect(tailSlide?.kind === 'list' ? tailSlide.players[0]?.name : '').toBe('Bruno Perić')
  expect(tailSlide?.kind === 'list' ? tailSlide.players : []).toHaveLength(1)
  const doc = footballTemplate(listSlide)
  expect(doc.html).not.toContain('class="ring"')
  expect(doc.html).not.toContain('stroke-dasharray')
  expect(doc.html).not.toMatch(/<span>#/)
  expect(doc.html).toContain('Brkić')
  expect(doc.html).toContain('GOLOVI</span>')
  expect(doc.html).toContain('>2</span>')
  expect(doc.html).toContain('MINUTE</span>')
  expect(doc.html).toMatch(/<span class="num"[^>]*>90/)
  expect(doc.html).toContain('KARTONI</span>')
  expect(doc.html).toContain('>Bez kartona</span>')
  expect(doc.html).toContain('Forward</span>')
  expect(doc.html).not.toContain('Perić')
})

test('Filip maps second yellow cards and a goals hero', () => {
  const filip = leagueAppearances[3]
  if (filip === undefined) throw new Error('missing filip fixture')
  const entry = catalogSlides([filip])[0]
  expect(entry?.player.stats.find((stat) => stat.key === 'cards')?.value).toBe('Drugi žuti')
  expect(entry?.player.hero).toBe('goals')
  const slides = footballSlides(catalogSlides(leagueAppearances))
  const list = slides[0]
  if (list?.kind !== 'list') return
  const doc = footballTemplate(list)
  expect(doc.html).toContain('Drugi žuti')
  expect(doc.heroes.map((hero) => hero.key)).toContain('goals')
  expect(doc.html).toContain('Šarić')
})

test('Bruno maps no hero and a substitute lineup', () => {
  const bruno = leagueAppearances[4]
  if (bruno === undefined) throw new Error('missing bruno fixture')
  const entry = catalogSlides([bruno])[0]
  expect(entry?.player.hero).toBe('none')
  expect(entry?.player.lineup).toBe('sub')
  const slides = footballSlides(catalogSlides(leagueAppearances))
  const tail = slides[1]
  if (tail?.kind !== 'list') return
  expect(tail.players[0]?.name).toContain('Perić')
  expect(footballTemplate(tail).html).not.toContain('kv hero')
})

test('catalog stats stay text-only', () => {
  const entry = catalogSlides(leagueAppearances)[0]
  expect(entry?.player.stats.map((stat) => stat.key)).toEqual([
    'goals',
    'assists',
    'minutes',
    'cards',
  ])
  for (const stat of entry?.player.stats ?? []) {
    expect(stat).not.toHaveProperty('accurate')
    expect(stat).not.toHaveProperty('total')
  }
  expect(entry?.player.number).toBeUndefined()
})
