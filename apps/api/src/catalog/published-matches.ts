import {
  publishedMatchPageSchema,
  publishedMatchSchema,
  type PublishedMatch,
  type PublishedMatchPage,
} from "@cro-sport-hub/shared-types";
import { count, desc, eq, type SQL } from "drizzle-orm";
import { alias, type PgDatabase, type PgQueryResultHKT } from "drizzle-orm/pg-core";
import { z } from "zod";
import * as schema from "./schema.js";

const { athletes, competitions, footballMatches, matches, teams, tennisMatches } = schema;
type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export type PublishedMatchQuery = { limit: number; offset: number };

/** Orders by `match_date`, which `matches_date_sport` supports. Status is a filter. */
export async function listPublishedMatches(
  db: CatalogDb,
  query: PublishedMatchQuery,
): Promise<PublishedMatchPage> {
  const filter = eq(matches.status, "published");
  const [counted, rows] = await Promise.all([
    db.select({ total: count() }).from(matches).where(filter),
    selectPublished(db, filter, query.limit, query.offset),
  ]);
  return publishedMatchPageSchema.parse({
    items: rows.map((row) => toPublished(row)),
    limit: query.limit,
    offset: query.offset,
    total: z
      .int()
      .nonnegative()
      .parse(Number(counted[0]?.total ?? 0)),
  });
}

function selectPublished(db: CatalogDb, filter: SQL, limit: number, offset: number) {
  const playerA = alias(athletes, "player_a");
  const playerB = alias(athletes, "player_b");
  const homeSide = alias(teams, "home_side");
  const awaySide = alias(teams, "away_side");
  return db
    .select({
      id: matches.id,
      date: matches.date,
      round: matches.round,
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
    .offset(offset);
}

type PublishedRow = Awaited<ReturnType<typeof selectPublished>>[number];

function winnerSide(winnerId: string | null, playerAId: string | null): "a" | "b" | null {
  if (winnerId === null) return null;
  return winnerId === playerAId ? "a" : "b";
}

function toPublished(row: PublishedRow): PublishedMatch {
  const card = {
    id: row.id,
    competition: row.competition,
    date: row.date,
    round: row.round,
  };
  if (row.sportSlug === "tennis") {
    return publishedMatchSchema.parse({
      ...card,
      sport: "tennis",
      playerA: row.playerA,
      playerB: row.playerB,
      winner: winnerSide(row.winnerId, row.playerAId),
      bestOf: row.bestOf,
      score: row.score,
      retired: row.retired,
    });
  }
  if (row.sportSlug === "football") {
    return publishedMatchSchema.parse({
      ...card,
      sport: "football",
      homeTeam: row.homeTeam,
      awayTeam: row.awayTeam,
      homeGoals: row.homeGoals,
      awayGoals: row.awayGoals,
    });
  }
  return publishedMatchSchema.parse({ ...card, sport: row.sportSlug });
}
