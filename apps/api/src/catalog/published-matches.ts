import {
  publishedMatchPageSchema,
  publishedMatchSchema,
  type PublishedMatch,
  type PublishedMatchPage,
} from '@cro-sport-hub/shared-types'
import { and, count, desc, eq, type SQL } from 'drizzle-orm'
import { alias, type PgDatabase, type PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import * as schema from './schema.js'

const { athletes, competitions, footballMatches, matches, sports, teams, tennisMatches } = schema
type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>

export const unknownSportMessage = 'Unknown sport'

/** A slug that is not a row in `sports`. The handler maps this to HTTP 404. */
export class UnknownSportError extends Error {
  constructor() {
    super(unknownSportMessage)
    this.name = 'UnknownSportError'
  }
}

export type PublishedMatchQuery = { limit: number; offset: number; sport?: string }

/**
 * Without `sport`, orders by `match_date` (`matches_date_sport`).
 * With `sport`, filters `sport_id` and `status` (`matches_sport_status_date`).
 */
export async function listPublishedMatches(
  db: CatalogDb,
  query: PublishedMatchQuery,
): Promise<PublishedMatchPage> {
  const sportId = query.sport === undefined ? undefined : await sportIdForSlug(db, query.sport)
  const filter = publishedFilter(sportId)
  const [counted, rows] = await Promise.all([
    db.select({ total: count() }).from(matches).where(filter),
    selectListedMatches(db, filter, query.limit, query.offset),
  ])
  return publishedMatchPageSchema.parse({
    items: rows.map((row) => toPublished(row)),
    limit: query.limit,
    offset: query.offset,
    total: z
      .int()
      .nonnegative()
      .parse(Number(counted[0]?.total ?? 0)),
  })
}

async function sportIdForSlug(db: CatalogDb, slug: string): Promise<string> {
  const rows = await db.select({ id: sports.id }).from(sports).where(eq(sports.slug, slug))
  const row = rows[0]
  if (row === undefined) throw new UnknownSportError()
  return row.id
}

function publishedFilter(sportId: string | undefined): SQL {
  const published = eq(matches.status, 'published')
  if (sportId === undefined) return published
  const filtered = and(eq(matches.sportId, sportId), published)
  if (filtered === undefined) throw new Error('The sport filter is missing')
  return filtered
}

/** The public list's joins, plus workflow columns for the editorial list. */
export function selectListedMatches(
  db: CatalogDb,
  filter: SQL | undefined,
  limit: number,
  offset: number,
) {
  const playerA = alias(athletes, 'player_a')
  const playerB = alias(athletes, 'player_b')
  const homeSide = alias(teams, 'home_side')
  const awaySide = alias(teams, 'away_side')
  return db
    .select({
      id: matches.id,
      date: matches.date,
      round: matches.round,
      status: matches.status,
      source: matches.source,
      sportSlug: matches.sportSlug,
      competition: competitions.name,
      playerAId: tennisMatches.playerAId,
      playerA: playerA.name,
      playerB: playerB.name,
      winnerId: tennisMatches.winnerId,
      bestOf: tennisMatches.bestOf,
      score: tennisMatches.score,
      retired: tennisMatches.retired,
      homeTeam: homeSide.name,
      awayTeam: awaySide.name,
      homeGoals: footballMatches.homeGoals,
      awayGoals: footballMatches.awayGoals,
    })
    .from(matches)
    .innerJoin(competitions, eq(competitions.id, matches.competitionId))
    .leftJoin(tennisMatches, eq(tennisMatches.matchId, matches.id))
    .leftJoin(playerA, eq(playerA.id, tennisMatches.playerAId))
    .leftJoin(playerB, eq(playerB.id, tennisMatches.playerBId))
    .leftJoin(footballMatches, eq(footballMatches.matchId, matches.id))
    .leftJoin(homeSide, eq(homeSide.id, footballMatches.homeTeamId))
    .leftJoin(awaySide, eq(awaySide.id, footballMatches.awayTeamId))
    .where(filter)
    .orderBy(desc(matches.date), desc(matches.id))
    .limit(limit)
    .offset(offset)
}

type PublishedRow = Awaited<ReturnType<typeof selectListedMatches>>[number]

function winnerSide(winnerId: string | null, playerAId: string | null): 'a' | 'b' | null {
  if (winnerId === null) return null
  return winnerId === playerAId ? 'a' : 'b'
}

function toPublished(row: PublishedRow): PublishedMatch {
  const card = {
    id: row.id,
    competition: row.competition,
    date: row.date,
    round: row.round,
  }
  if (row.sportSlug === 'tennis') {
    return publishedMatchSchema.parse({
      ...card,
      sport: 'tennis',
      playerA: row.playerA,
      playerB: row.playerB,
      winner: winnerSide(row.winnerId, row.playerAId),
      bestOf: row.bestOf,
      score: row.score,
      retired: row.retired,
    })
  }
  if (row.sportSlug === 'football') {
    return publishedMatchSchema.parse({
      ...card,
      sport: 'football',
      homeTeam: row.homeTeam,
      awayTeam: row.awayTeam,
      homeGoals: row.homeGoals,
      awayGoals: row.awayGoals,
    })
  }
  return publishedMatchSchema.parse({ ...card, sport: row.sportSlug })
}
