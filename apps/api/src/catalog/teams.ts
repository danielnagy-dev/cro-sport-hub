import { teamSchema, type Team } from "@cro-sport-hub/shared-types";
import { asc, eq, or } from "drizzle-orm";
import { CatalogError, parseRecord, type CatalogDb } from "./errors.js";
import { athleteTeams, footballMatches, sports, teams } from "./schema.js";

function sqlState(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "string" && /^[0-9A-Z]{5}$/.test(error.code)) {
    return error.code;
  }
  return "cause" in error ? sqlState(error.cause) : undefined;
}

function storedTeam(row: typeof teams.$inferSelect): Team {
  return parseRecord(teamSchema, {
    id: row.id,
    sportId: row.sportId,
    slug: row.slug,
    name: row.name,
    shortName: row.shortName,
    country: row.country,
    ...(row.crestUrl === null ? {} : { crestUrl: row.crestUrl }),
  });
}

/** Same football-club rule as `write("team")`. */
async function requireFootball(db: CatalogDb, sportId: string): Promise<void> {
  const rows = await db.select({ slug: sports.slug }).from(sports).where(eq(sports.id, sportId));
  const slug = rows[0]?.slug;
  if (slug === undefined) throw new CatalogError("unknown-ref", "The sport is not in the catalog");
  if (slug !== "football") throw new CatalogError("not-football", "Teams are football clubs");
}

export async function listTeams(db: CatalogDb): Promise<Team[]> {
  const rows = await db
    .select()
    .from(teams)
    .where(eq(teams.sportSlug, "football"))
    .orderBy(asc(teams.name));
  return rows.map(storedTeam);
}

export async function replaceTeam(db: CatalogDb, value: unknown): Promise<Team> {
  const team = parseRecord(teamSchema, value);
  await requireFootball(db, team.sportId);
  const existing = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, team.id));
  if (existing.length === 0) throw new CatalogError("unknown-ref", "Unknown team");
  try {
    await db
      .update(teams)
      .set({
        sportId: team.sportId,
        sportSlug: "football",
        slug: team.slug,
        name: team.name,
        shortName: team.shortName,
        country: team.country,
        crestUrl: team.crestUrl ?? null,
      })
      .where(eq(teams.id, team.id));
  } catch (error) {
    if (sqlState(error) === "23505")
      throw new CatalogError("conflict", "That record is already stored");
    throw error;
  }
  return team;
}

export async function deleteTeam(db: CatalogDb, id: string): Promise<void> {
  const existing = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, id));
  if (existing.length === 0) throw new CatalogError("unknown-ref", "Unknown team");
  const side = await db
    .select({ id: footballMatches.matchId })
    .from(footballMatches)
    .where(or(eq(footballMatches.homeTeamId, id), eq(footballMatches.awayTeamId, id)))
    .limit(1);
  const spell = await db
    .select({ teamId: athleteTeams.teamId })
    .from(athleteTeams)
    .where(eq(athleteTeams.teamId, id))
    .limit(1);
  if (side.length > 0 || spell.length > 0) throw new CatalogError("conflict", "Team is in use");
  try {
    await db.delete(teams).where(eq(teams.id, id));
  } catch (error) {
    if (sqlState(error) === "23503") throw new CatalogError("conflict", "Team is in use");
    throw error;
  }
}
