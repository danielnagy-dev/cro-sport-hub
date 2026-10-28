import {
  athleteNameListSchema,
  publicAthleteSchema,
  type AthleteName,
  type PublicAthlete,
} from '@cro-sport-hub/shared-types'
import { asc, eq } from 'drizzle-orm'
import { type PgDatabase, type PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { UnknownSportError } from './published-matches.js'
import * as schema from './schema.js'

const { athleteTeams, athletes, sports, teams } = schema
type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>

export const unknownAthleteMessage = 'Unknown athlete'

/** A slug that is not an athlete row. The handler maps this to HTTP 404. */
export class UnknownAthleteError extends Error {
  constructor() {
    super(unknownAthleteMessage)
    this.name = 'UnknownAthleteError'
  }
}

async function sportIdForSlug(db: CatalogDb, slug: string): Promise<string> {
  const rows = await db.select({ id: sports.id }).from(sports).where(eq(sports.slug, slug))
  const row = rows[0]
  if (row === undefined) throw new UnknownSportError()
  return row.id
}

function omitNulls(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null))
}

type Spell = { name: string; from: string; to: string | null }

/** Current spell (`to` absent) first, then newer start dates. */
function currentThenOlder(left: Spell, right: Spell): number {
  const current = Number(left.to !== null) - Number(right.to !== null)
  if (current !== 0) return current
  if (left.from === right.from) return 0
  return left.from < right.from ? 1 : -1
}

export async function readPublicAthlete(db: CatalogDb, slug: string): Promise<PublicAthlete> {
  const rows = await db
    .select({
      id: athletes.id,
      slug: athletes.slug,
      name: athletes.name,
      sport: athletes.sportSlug,
      country: athletes.country,
      birthYear: athletes.birthYear,
      position: athletes.position,
    })
    .from(athletes)
    .where(eq(athletes.slug, slug))
  const athlete = rows[0]
  if (athlete === undefined) throw new UnknownAthleteError()
  const spells = await db
    .select({ name: teams.name, from: athleteTeams.from, to: athleteTeams.to })
    .from(athleteTeams)
    .innerJoin(teams, eq(teams.id, athleteTeams.teamId))
    .where(eq(athleteTeams.athleteId, athlete.id))
  return publicAthleteSchema.parse({
    ...omitNulls({
      slug: athlete.slug,
      name: athlete.name,
      sport: athlete.sport,
      country: athlete.country,
      birthYear: athlete.birthYear,
      position: athlete.position,
    }),
    clubs: [...spells].sort(currentThenOlder).map((spell) => omitNulls(spell)),
  })
}

export async function listPublicAthletes(db: CatalogDb, sport: string): Promise<AthleteName[]> {
  const sportId = await sportIdForSlug(db, sport)
  const rows = await db
    .select({ slug: athletes.slug, name: athletes.name })
    .from(athletes)
    .where(eq(athletes.sportId, sportId))
    .orderBy(asc(athletes.name))
  return athleteNameListSchema.parse(rows)
}
