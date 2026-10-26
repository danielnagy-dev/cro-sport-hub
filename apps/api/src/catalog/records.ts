import {
  appearanceSchema,
  athleteSchema,
  athleteTeamSchema,
  competitionSchema,
  footballMatchSchema,
  idSchema,
  matchSchema,
  roleSchema,
  sportSchema,
  teamSchema,
  tennisMatchSchema,
  tennisMatchStatsSchema,
  type SportSlug,
} from "@cro-sport-hub/shared-types";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  CatalogError,
  invalidRecord,
  parseRecord,
  type AthleteTeamKey,
  type CatalogDb,
  type CatalogKind,
  type CatalogParticipantKey,
  type CatalogWriteKind,
  type Stored,
} from "./errors.js";
import * as schema from "./schema.js";

const {
  appearances,
  athleteTeams,
  athletes,
  competitions,
  footballMatches,
  matches,
  sports,
  teams,
  tennisMatchStats,
  tennisMatches,
  users,
} = schema;
const userSchema = z.strictObject({ id: idSchema, role: roleSchema });

function sqlState(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "string" && /^[0-9A-Z]{5}$/.test(error.code)) {
    return error.code;
  }
  return "cause" in error ? sqlState(error.cause) : undefined;
}

function publicRow(row: Record<string, unknown>, hidden: readonly string[]) {
  return Object.fromEntries(
    Object.entries(row).filter(([key, value]) => value !== null && !hidden.includes(key)),
  );
}

async function insertRow(run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (error) {
    const state = sqlState(error);
    if (state === "23505") throw new CatalogError("conflict", "That record is already stored");
    if (state === "23503") throw new CatalogError("unknown-ref", "Unknown row");
    if (state === "23514") throw new CatalogError("invalid", "That record breaks a catalog rule");
    throw error;
  }
}

function knownSlug(slug: string | undefined, missing: string): SportSlug {
  if (slug === "tennis" || slug === "football") return slug;
  throw new CatalogError("unknown-ref", missing);
}

async function sportSlug(db: CatalogDb, sportId: string): Promise<SportSlug> {
  const rows = await db.select({ slug: sports.slug }).from(sports).where(eq(sports.id, sportId));
  return knownSlug(rows[0]?.slug, "The sport is not in the catalog");
}

export async function competitionSport(db: CatalogDb, competitionId: string): Promise<SportSlug> {
  const rows = await db
    .select({ sportId: competitions.sportId })
    .from(competitions)
    .where(eq(competitions.id, competitionId));
  const sportId = rows[0]?.sportId;
  if (sportId === undefined) {
    throw new CatalogError("unknown-ref", "The competition is not in the catalog");
  }
  return sportSlug(db, sportId);
}

export async function matchSlug(db: CatalogDb, matchId: string): Promise<SportSlug> {
  const rows = await db
    .select({ sportSlug: matches.sportSlug })
    .from(matches)
    .where(eq(matches.id, matchId));
  return knownSlug(rows[0]?.sportSlug, "The match is not in the catalog");
}

async function athleteSlug(db: CatalogDb, athleteId: string): Promise<SportSlug> {
  const rows = await db
    .select({ sportSlug: athletes.sportSlug })
    .from(athletes)
    .where(eq(athletes.id, athleteId));
  return knownSlug(rows[0]?.sportSlug, "The athlete is not in the catalog");
}

export async function sportIdFor(db: CatalogDb, sport: "tennis" | "football"): Promise<string> {
  const rows = await db.select({ id: sports.id }).from(sports).where(eq(sports.slug, sport));
  const id = rows[0]?.id;
  if (id === undefined) throw new CatalogError("unknown-ref", "The sport is not in the catalog");
  return id;
}

export async function writeRecord(
  db: CatalogDb,
  kind: CatalogWriteKind,
  value: unknown,
): Promise<void> {
  switch (kind) {
    case "competition":
      return insertRow(() => db.insert(competitions).values(parseRecord(competitionSchema, value)));
    case "team": {
      const team = parseRecord(teamSchema, value);
      if ((await sportSlug(db, team.sportId)) !== "football") {
        throw new CatalogError("not-football", "Teams are football clubs");
      }
      return insertRow(() => db.insert(teams).values({ ...team, sportSlug: "football" }));
    }
    case "athlete": {
      const athlete = parseRecord(athleteSchema, value);
      const slug = await sportSlug(db, athlete.sportId);
      return insertRow(() => db.insert(athletes).values({ ...athlete, sportSlug: slug }));
    }
    case "athleteTeam": {
      const period = parseRecord(athleteTeamSchema, value);
      const athleteSport = await athleteSlug(db, period.athleteId);
      if (athleteSport !== "football") {
        throw new CatalogError("not-football", "Club spells are for football athletes");
      }
      return insertRow(() => db.insert(athleteTeams).values({ ...period, athleteSport }));
    }
    case "user":
      return insertRow(() => db.insert(users).values(parseRecord(userSchema, value)));
    case "match": {
      const match = parseRecord(matchSchema, value);
      const sport = await sportSlug(db, match.sportId);
      if ((await competitionSport(db, match.competitionId)) !== sport) {
        throw new CatalogError("invalid", "The match sport does not match the competition");
      }
      return insertRow(() => db.insert(matches).values({ ...match, sportSlug: sport }));
    }
    case "tennisMatch": {
      const detail = parseRecord(tennisMatchSchema, value);
      if ((await matchSlug(db, detail.matchId)) !== "tennis") {
        throw new CatalogError("invalid", "A tennis match needs a tennis match");
      }
      if (
        (await athleteSlug(db, detail.playerAId)) !== "tennis" ||
        (await athleteSlug(db, detail.playerBId)) !== "tennis"
      ) {
        throw new CatalogError("invalid", "Tennis matches are for tennis athletes");
      }
      return insertRow(() =>
        db.insert(tennisMatches).values({
          ...detail,
          sportSlug: "tennis",
          playerASport: "tennis",
          playerBSport: "tennis",
        }),
      );
    }
    case "tennisMatchStats": {
      const stats = parseRecord(tennisMatchStatsSchema, value);
      const players = await db
        .select({ playerAId: tennisMatches.playerAId, playerBId: tennisMatches.playerBId })
        .from(tennisMatches)
        .where(eq(tennisMatches.matchId, stats.matchId));
      const pair = players[0];
      if (pair === undefined) {
        throw new CatalogError("unknown-ref", "The tennis match is not in the catalog");
      }
      if (stats.athleteId !== pair.playerAId && stats.athleteId !== pair.playerBId) {
        throw new CatalogError("invalid", "Stats belong to one of the two players");
      }
      return insertRow(() =>
        db.insert(tennisMatchStats).values({ ...stats, athleteSport: "tennis" }),
      );
    }
    case "footballMatch": {
      const detail = parseRecord(footballMatchSchema, value);
      if ((await matchSlug(db, detail.matchId)) !== "football") {
        throw new CatalogError("invalid", "A football match needs a football match");
      }
      return insertRow(() =>
        db.insert(footballMatches).values({ ...detail, sportSlug: "football" }),
      );
    }
    case "appearance": {
      const row = parseRecord(appearanceSchema, value);
      if ((await matchSlug(db, row.matchId)) !== "football") {
        throw new CatalogError("invalid", "An appearance needs a football match");
      }
      if ((await athleteSlug(db, row.athleteId)) !== "football") {
        throw new CatalogError("invalid", "Appearances are for football athletes");
      }
      const sides = await db
        .select({ homeTeamId: footballMatches.homeTeamId, awayTeamId: footballMatches.awayTeamId })
        .from(footballMatches)
        .where(eq(footballMatches.matchId, row.matchId));
      const pair = sides[0];
      if (pair === undefined) {
        throw new CatalogError("unknown-ref", "The football match is not in the catalog");
      }
      if (row.teamId !== pair.homeTeamId && row.teamId !== pair.awayTeamId) {
        throw new CatalogError("invalid", "The appearance club is one of the two sides");
      }
      return insertRow(() =>
        db.insert(appearances).values({ ...row, matchSport: "football", athleteSport: "football" }),
      );
    }
    default: {
      const unexpected: never = kind;
      return unexpected;
    }
  }
}

const idTables = {
  sport: sports,
  competition: competitions,
  team: teams,
  athlete: athletes,
  user: users,
};
const idParsers = {
  sport: sportSchema,
  competition: competitionSchema,
  team: teamSchema,
  athlete: athleteSchema,
  user: userSchema,
};

async function readMatchRow(
  db: CatalogDb,
  kind: "match" | "tennisMatch" | "tennisMatchStats" | "footballMatch" | "appearance",
  key: string | AthleteTeamKey | CatalogParticipantKey,
): Promise<Stored | undefined> {
  if (kind === "tennisMatchStats" || kind === "appearance") {
    if (typeof key === "string" || !("matchId" in key)) {
      throw new CatalogError(
        "invalid",
        kind === "appearance"
          ? "An appearance is read by match and athlete"
          : "Tennis stats are read by match and athlete",
      );
    }
    if (kind === "appearance") {
      const rows = await db
        .select()
        .from(appearances)
        .where(and(eq(appearances.matchId, key.matchId), eq(appearances.athleteId, key.athleteId)));
      const row = rows[0];
      return row === undefined
        ? undefined
        : parseRecord(appearanceSchema, publicRow(row, ["matchSport", "athleteSport"]));
    }
    const rows = await db
      .select()
      .from(tennisMatchStats)
      .where(
        and(
          eq(tennisMatchStats.matchId, key.matchId),
          eq(tennisMatchStats.athleteId, key.athleteId),
        ),
      );
    const row = rows[0];
    return row === undefined
      ? undefined
      : parseRecord(tennisMatchStatsSchema, publicRow(row, ["athleteSport"]));
  }
  if (typeof key !== "string") throw new CatalogError("invalid", "That record is read by id");
  if (kind === "match") {
    const rows = await db.select().from(matches).where(eq(matches.id, key));
    const row = rows[0];
    return row === undefined ? undefined : parseRecord(matchSchema, publicRow(row, ["sportSlug"]));
  }
  if (kind === "footballMatch") {
    const rows = await db.select().from(footballMatches).where(eq(footballMatches.matchId, key));
    const row = rows[0];
    return row === undefined
      ? undefined
      : parseRecord(footballMatchSchema, publicRow(row, ["sportSlug"]));
  }
  const rows = await db.select().from(tennisMatches).where(eq(tennisMatches.matchId, key));
  const row = rows[0];
  return row === undefined
    ? undefined
    : parseRecord(tennisMatchSchema, publicRow(row, ["sportSlug", "playerASport", "playerBSport"]));
}

export async function readRecord(
  db: CatalogDb,
  kind: CatalogKind,
  key: string | AthleteTeamKey | CatalogParticipantKey,
): Promise<Stored | undefined> {
  if (
    kind === "match" ||
    kind === "tennisMatch" ||
    kind === "tennisMatchStats" ||
    kind === "footballMatch" ||
    kind === "appearance"
  ) {
    return readMatchRow(db, kind, key);
  }
  if (kind === "athleteTeam") {
    if (typeof key === "string" || !("teamId" in key)) {
      throw new CatalogError("invalid", "A club spell is read by athlete, club, and start date");
    }
    const rows = await db
      .select()
      .from(athleteTeams)
      .where(
        and(
          eq(athleteTeams.athleteId, key.athleteId),
          eq(athleteTeams.teamId, key.teamId),
          eq(athleteTeams.from, key.from),
        ),
      );
    const row = rows[0];
    return row === undefined
      ? undefined
      : parseRecord(athleteTeamSchema, publicRow(row, ["athleteSport"]));
  }
  if (typeof key !== "string") throw new CatalogError("invalid", "That record is read by id");
  const table = idTables[kind];
  const rows = await db.select().from(table).where(eq(table.id, key));
  const row = rows[0];
  if (row === undefined) return undefined;
  const hidden = kind === "team" || kind === "athlete" ? ["sportSlug"] : [];
  const parsed = idParsers[kind].safeParse(publicRow(row, hidden));
  if (!parsed.success) return invalidRecord(parsed.error);
  return parsed.data;
}
