import { catalogDb, type AthleteTeamKey, type Catalog, type CatalogWriteKind } from './catalog.js'
import type { CatalogDb } from './errors.js'
import * as schema from './schema.js'

type SeedKey = string | AthleteTeamKey
type SeedRow = { kind: CatalogWriteKind; key: SeedKey; value: unknown }

const EDITOR = { id: 'editor-demo', role: 'editor' as const } as const
const ADMIN = { id: 'admin-demo', role: 'admin' as const } as const
const SEED_AT = '2026-11-01T12:00:00+00:00'

const CUP = {
  id: 'comp-sample-cup',
  sportId: 'sport-tennis',
  name: 'Sample Cup',
  season: '2026',
  level: 'international' as const,
} as const
const LEAGUE = {
  id: 'comp-sample-league',
  sportId: 'sport-football',
  name: 'Sample League',
  season: '2026/27',
  level: 'domestic' as const,
} as const
const HOOPS = {
  id: 'comp-sample-hoops',
  sportId: 'sport-basketball',
  name: 'Sample Hoops Cup',
  season: '2026/27',
  level: 'international' as const,
} as const

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

function hoopster(suffix: string, name: string, position: string) {
  const id = `sample-hooper-${suffix}`
  return { id, slug: id, name, sportId: 'sport-basketball', country: 'HR', position }
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

const hooperA = hoopster('a', 'Sample Hooper A', 'Guard')
const hooperB = hoopster('b', 'Sample Hooper B', 'Forward')
const hooperC = hoopster('c', 'Sample Hooper C', 'Center')
export const seedBasketballAthletes = [hooperA, hooperB, hooperC]

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

function row(kind: CatalogWriteKind, key: SeedKey, value: unknown): SeedRow {
  return { kind, key, value }
}

function byId(kind: CatalogWriteKind, value: { id: string }): SeedRow {
  return row(kind, value.id, value)
}

export const seedRows: readonly SeedRow[] = [
  byId('user', EDITOR),
  byId('user', ADMIN),
  byId('competition', CUP),
  byId('competition', LEAGUE),
  byId('competition', HOOPS),
  byId('team', home),
  byId('team', away),
  byId('team', town),
  ...seedTennisAthletes.map((athlete) => byId('athlete', athlete)),
  ...seedFootballAthletes.map((athlete) => byId('athlete', athlete)),
  ...seedBasketballAthletes.map((athlete) => byId('athlete', athlete)),
  ...spells.map((period) => row('athleteTeam', period, period)),
]

const croatiaFootball = {
  id: 'nt-croatia-football',
  sportId: 'sport-football',
  sportSlug: 'football' as const,
  slug: 'croatia-football',
  name: 'Sample Croatia Football',
  selection: 'A',
  ageBand: 'senior',
  sex: 'men' as const,
  country: 'HR',
}

const croatiaBasketball = {
  id: 'nt-croatia-basketball',
  sportId: 'sport-basketball',
  sportSlug: 'basketball' as const,
  slug: 'croatia-basketball',
  name: 'Sample Croatia Basketball',
  selection: 'A',
  ageBand: 'senior',
  sex: 'men' as const,
  country: 'HR',
}

const editorialAppearances = [
  {
    id: 'appearance-sample-tennis',
    sportId: 'sport-tennis',
    sportSlug: 'tennis' as const,
    competitionId: CUP.id,
    athleteId: playerA.id,
    athleteSport: 'tennis' as const,
    nationalTeamId: null,
    opponentLabel: 'Sample Rival',
    startsAt: '2026-11-08T14:00:00+00:00',
    endsAt: '2026-11-08T16:10:00+00:00',
    status: 'completed' as const,
    result: { sets: '2-0', winner: playerA.id },
    creatorKind: 'manual' as const,
    createdAt: SEED_AT,
    updatedAt: SEED_AT,
  },
  {
    id: 'appearance-sample-football',
    sportId: 'sport-football',
    sportSlug: 'football' as const,
    competitionId: LEAGUE.id,
    athleteId: karlo.id,
    athleteSport: 'football' as const,
    nationalTeamId: null,
    opponentLabel: 'Sample Away',
    startsAt: '2026-11-09T18:00:00+00:00',
    endsAt: '2026-11-09T19:50:00+00:00',
    status: 'completed' as const,
    result: { score: '2-1', club: home.name },
    creatorKind: 'manual' as const,
    createdAt: SEED_AT,
    updatedAt: SEED_AT,
  },
  {
    id: 'appearance-sample-football-nt',
    sportId: 'sport-football',
    sportSlug: 'football' as const,
    competitionId: LEAGUE.id,
    athleteId: null,
    athleteSport: null,
    nationalTeamId: croatiaFootball.id,
    opponentLabel: 'Sample Neighbours',
    startsAt: '2026-11-12T19:45:00+00:00',
    endsAt: '2026-11-12T21:35:00+00:00',
    status: 'completed' as const,
    result: { score: '1-0' },
    creatorKind: 'manual' as const,
    createdAt: SEED_AT,
    updatedAt: SEED_AT,
  },
  {
    id: 'appearance-sample-basketball',
    sportId: 'sport-basketball',
    sportSlug: 'basketball' as const,
    competitionId: HOOPS.id,
    athleteId: hooperA.id,
    athleteSport: 'basketball' as const,
    nationalTeamId: null,
    opponentLabel: 'Sample Opponents',
    startsAt: '2026-11-15T17:00:00+00:00',
    endsAt: null,
    status: 'scheduled' as const,
    result: null,
    creatorKind: 'manual' as const,
    createdAt: SEED_AT,
    updatedAt: SEED_AT,
  },
  {
    id: 'appearance-sample-basketball-nt',
    sportId: 'sport-basketball',
    sportSlug: 'basketball' as const,
    competitionId: HOOPS.id,
    athleteId: null,
    athleteSport: null,
    nationalTeamId: croatiaBasketball.id,
    opponentLabel: 'Sample Visitors',
    startsAt: '2026-11-16T18:30:00+00:00',
    endsAt: '2026-11-16T20:15:00+00:00',
    status: 'completed' as const,
    result: { score: '78-71' },
    creatorKind: 'bot' as const,
    createdAt: SEED_AT,
    updatedAt: SEED_AT,
  },
]

const editorialLineups = [
  {
    appearanceId: 'appearance-sample-football-nt',
    athleteId: karlo.id,
    athleteSport: 'football' as const,
    started: true,
    minutes: 90,
    stats: { goals: 1, assists: 0 },
  },
  {
    appearanceId: 'appearance-sample-football-nt',
    athleteId: mateo.id,
    athleteSport: 'football' as const,
    started: true,
    minutes: 80,
    stats: { goals: 0, assists: 1 },
  },
  {
    appearanceId: 'appearance-sample-basketball-nt',
    athleteId: hooperA.id,
    athleteSport: 'basketball' as const,
    started: true,
    minutes: 28,
    stats: { points: 14, rebounds: 3, assists: 5 },
  },
  {
    appearanceId: 'appearance-sample-basketball-nt',
    athleteId: hooperB.id,
    athleteSport: 'basketball' as const,
    started: true,
    minutes: 24,
    stats: { points: 11, rebounds: 6, assists: 2 },
  },
]

const demoPublishSlot = {
  id: 'publish-slot-sample-1530',
  slotDate: '2026-11-22',
  slotClockId: 'slot-clock-1530',
  status: 'planned' as const,
  slideOrder: ['appearance-sample-tennis', 'appearance-sample-football'],
  creatorKind: 'manual' as const,
  createdAt: SEED_AT,
  updatedAt: SEED_AT,
}

async function seedEditorial(db: CatalogDb): Promise<void> {
  await db
    .insert(schema.nationalTeams)
    .values([croatiaFootball, croatiaBasketball])
    .onConflictDoNothing()
  await db.insert(schema.appearances).values(editorialAppearances).onConflictDoNothing()
  await db.insert(schema.lineupEntries).values(editorialLineups).onConflictDoNothing()
  await db.insert(schema.publishSlots).values(demoPublishSlot).onConflictDoNothing()
}

export async function seedCatalog(catalog: Catalog): Promise<void> {
  for (const entry of seedRows) {
    if ((await catalog.read(entry.kind, entry.key)) === undefined) {
      await catalog.write(entry.kind, entry.value)
    }
  }
  await seedEditorial(catalogDb(catalog))
}
