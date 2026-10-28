import type { AthleteTeamKey, Catalog, CatalogParticipantKey, CatalogWriteKind } from './catalog.js'

/**
 * Fictional sample rows for local Postgres. Names follow the Sample Player
 * stories and the slide sample. No photos, crests, or credentials.
 * `editor-demo` and `admin-demo` are catalog roles (id and role only).
 */

type SeedKey = string | AthleteTeamKey | CatalogParticipantKey
type SeedRow = { kind: CatalogWriteKind; key: SeedKey; value: unknown }

const editor = { id: 'editor-demo', role: 'editor' as const }
const admin = { id: 'admin-demo', role: 'admin' as const }

const cup = {
  id: 'comp-sample-cup',
  sportId: 'sport-tennis',
  name: 'Sample Cup',
  season: '2026',
  level: 'international' as const,
}
const league = {
  id: 'comp-sample-league',
  sportId: 'sport-football',
  name: 'Sample League',
  season: '2026/27',
  level: 'domestic' as const,
}

function club(id: string, slug: string, name: string, shortName: string) {
  return { id, sportId: 'sport-football', slug, name, shortName, country: 'HR' }
}

const home = club('club-sample-home', 'sample-home', 'Sample Home', 'SH')
const away = club('club-sample-away', 'sample-away', 'Sample Away', 'SA')
const town = club('club-sample-town', 'sample-town', 'Sample Town', 'ST')

function tennisPlayer(suffix: string, name: string) {
  const id = `sample-player-${suffix}`
  return { id, slug: id, name, sportId: 'sport-tennis', country: 'HR' }
}

function footballer(id: string, name: string, position: string) {
  return { id, slug: id, name, sportId: 'sport-football', country: 'HR', position }
}

const playerA = tennisPlayer('a', 'Sample Player A')
const playerB = tennisPlayer('b', 'Sample Player B')
const playerC = tennisPlayer('c', 'Sample Player C')
const playerD = tennisPlayer('d', 'Sample Player D')
export const seedTennisAthletes = [playerA, playerB, playerC, playerD]

const karlo = footballer('karlo-brkic', 'Karlo Brkić', 'Forward')
const filip = footballer('filip-saric', 'Filip Šarić', 'Right back')
const mateo = footballer('mateo-jurcic', 'Mateo Jurčić', 'Midfielder')
const leon = footballer('leon-vukovic', 'Leon Vuković', 'Goalkeeper')
const bruno = footballer('bruno-peric', 'Bruno Perić', 'Forward')
export const seedFootballAthletes = [karlo, filip, mateo, leon, bruno]

function spell(athleteId: string, teamId: string, from: string, to?: string) {
  return to === undefined ? { athleteId, teamId, from } : { athleteId, teamId, from, to }
}

const spells = [
  spell(karlo.id, town.id, '2023-07-01', '2025-06-30'),
  spell(karlo.id, home.id, '2025-07-01'),
  spell(filip.id, away.id, '2024-08-01'),
  spell(mateo.id, away.id, '2022-07-01', '2024-06-30'),
  spell(mateo.id, home.id, '2024-07-01'),
  spell(leon.id, home.id, '2024-07-01'),
  spell(bruno.id, away.id, '2025-07-01'),
]

const finalMatch = {
  id: 'match-sample-final',
  sportId: 'sport-tennis',
  competitionId: cup.id,
  date: '2026-10-18',
  round: 'Final',
  status: 'published' as const,
  source: 'manual' as const,
  createdBy: editor.id,
  reviewedBy: admin.id,
  publishedAt: '2026-10-18T18:00:00+00:00',
}
const finalDetail = {
  matchId: finalMatch.id,
  playerAId: playerA.id,
  playerBId: playerB.id,
  winnerId: playerA.id,
  bestOf: 3 as const,
  score: [
    [6, 4],
    [7, 6, 5],
  ],
  retired: false,
}
const statsA = {
  matchId: finalMatch.id,
  athleteId: playerA.id,
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
  winners: 8,
  unforcedErrors: 5,
  totalPointsWon: 20,
}
const statsB = {
  matchId: finalMatch.id,
  athleteId: playerB.id,
  aces: 1,
  doubleFaults: 2,
  firstServeIn: 4,
  firstServeTotal: 8,
  firstServePointsWon: 2,
  secondServePointsWon: 1,
  secondServeTotal: 4,
  breakPointsSaved: 0,
  breakPointsFaced: 1,
  breakPointsWon: 1,
  breakPointsTotal: 2,
  totalPointsWon: 12,
}
const quarterfinal = {
  id: 'match-sample-qf',
  sportId: 'sport-tennis',
  competitionId: cup.id,
  date: '2026-10-16',
  round: 'QF',
  status: 'draft' as const,
  source: 'manual' as const,
  createdBy: editor.id,
}
const retiredDetail = {
  matchId: quarterfinal.id,
  playerAId: playerC.id,
  playerBId: playerD.id,
  winnerId: playerC.id,
  bestOf: 3 as const,
  score: [
    [6, 3],
    [4, 2],
  ],
  retired: true,
}

const leagueMatch = {
  id: 'match-sample-league',
  sportId: 'sport-football',
  competitionId: league.id,
  date: '2026-10-19',
  round: 'Matchday 8',
  status: 'published' as const,
  source: 'manual' as const,
  createdBy: editor.id,
  reviewedBy: admin.id,
  publishedAt: '2026-10-19T20:00:00+00:00',
}
const scoreline = {
  matchId: leagueMatch.id,
  homeTeamId: home.id,
  awayTeamId: away.id,
  homeGoals: 2,
  awayGoals: 1,
}

function appearance(
  athleteId: string,
  teamId: string,
  started: boolean,
  minutes: number,
  goals: number,
  assists: number,
  yellowCards: number,
  redCard: boolean,
) {
  return {
    matchId: leagueMatch.id,
    athleteId,
    teamId,
    started,
    minutes,
    goals,
    assists,
    yellowCards,
    redCard,
  }
}

const appearances = [
  appearance(karlo.id, home.id, true, 90, 2, 0, 0, false),
  appearance(mateo.id, home.id, true, 75, 0, 1, 1, false),
  appearance(leon.id, home.id, true, 90, 0, 0, 0, false),
  appearance(filip.id, away.id, true, 90, 1, 0, 2, true),
  appearance(bruno.id, away.id, false, 0, 0, 0, 1, false),
]

function row(kind: CatalogWriteKind, key: SeedKey, value: unknown): SeedRow {
  return { kind, key, value }
}

function byId(kind: CatalogWriteKind, value: { id: string }): SeedRow {
  return row(kind, value.id, value)
}

export const seedRows: readonly SeedRow[] = [
  byId('user', editor),
  byId('user', admin),
  byId('competition', cup),
  byId('competition', league),
  byId('team', home),
  byId('team', away),
  byId('team', town),
  ...seedTennisAthletes.map((athlete) => byId('athlete', athlete)),
  ...seedFootballAthletes.map((athlete) => byId('athlete', athlete)),
  ...spells.map((period) => row('athleteTeam', period, period)),
  byId('match', finalMatch),
  row('tennisMatch', finalMatch.id, finalDetail),
  row('tennisMatchStats', { matchId: statsA.matchId, athleteId: statsA.athleteId }, statsA),
  row('tennisMatchStats', { matchId: statsB.matchId, athleteId: statsB.athleteId }, statsB),
  byId('match', quarterfinal),
  row('tennisMatch', quarterfinal.id, retiredDetail),
  byId('match', leagueMatch),
  row('footballMatch', leagueMatch.id, scoreline),
  ...appearances.map((line) =>
    row('appearance', { matchId: line.matchId, athleteId: line.athleteId }, line),
  ),
]

/** Inserts each sample row that `read` does not already return. */
export async function seedCatalog(catalog: Catalog): Promise<void> {
  for (const entry of seedRows) {
    if ((await catalog.read(entry.kind, entry.key)) === undefined) {
      await catalog.write(entry.kind, entry.value)
    }
  }
}
