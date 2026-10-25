import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  athleteSchema,
  athleteTeamSchema,
  competitionSchema,
  idSchema,
  roleSchema,
  sportSchema,
  teamSchema,
  type AthleteTeam,
  type FieldIssue,
  type Role,
  type SportSlug,
} from "@cro-sport-hub/shared-types";
import { and, eq, sql } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { z } from "zod";
import * as schema from "./schema.js";

const { athleteTeams, athletes, competitions, sports, teams, users } = schema;
const userSchema = z.strictObject({ id: idSchema, role: roleSchema });

export type CatalogUser = { id: string; role: Role };
export type CatalogWriteKind = "competition" | "team" | "athlete" | "athleteTeam" | "user";
export type CatalogKind = "sport" | CatalogWriteKind;
export type AthleteTeamKey = Pick<AthleteTeam, "athleteId" | "teamId" | "from">;
export type CatalogErrorCode =
  | "invalid"
  | "not-football"
  | "unknown-ref"
  | "conflict"
  | "unreachable"
  | "migration";

export class CatalogError extends Error {
  constructor(
    readonly code: CatalogErrorCode,
    message: string,
    readonly issues?: readonly FieldIssue[],
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "CatalogError";
  }
}

type Stored =
  | z.output<typeof sportSchema>
  | z.output<typeof competitionSchema>
  | z.output<typeof teamSchema>
  | z.output<typeof athleteSchema>
  | z.output<typeof athleteTeamSchema>
  | CatalogUser;

export type Catalog = {
  write(kind: CatalogWriteKind, value: unknown): Promise<void>;
  read(kind: CatalogKind, key: string | AthleteTeamKey): Promise<Stored | undefined>;
  close(): Promise<void>;
};

type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>;

const migrationPath = join(dirname(fileURLToPath(import.meta.url)), "0001_v1_catalog.sql");

function migrationStatements(): string[] {
  return readFileSync(migrationPath, "utf8")
    .replaceAll(/--.*$/gm, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

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

function invalidRecord(error: z.ZodError): never {
  throw new CatalogError(
    "invalid",
    "The record does not match the shared schema",
    error.issues.map((issue) => ({ path: issue.path.map(String), message: issue.message })),
    { cause: error },
  );
}

function parseRecord<T>(
  parser: { safeParse: (value: unknown) => z.ZodSafeParseResult<T> },
  value: unknown,
): T {
  const result = parser.safeParse(value);
  if (result.success) return result.data;
  return invalidRecord(result.error);
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

async function sportSlug(db: CatalogDb, sportId: string): Promise<SportSlug> {
  const rows = await db.select({ slug: sports.slug }).from(sports).where(eq(sports.id, sportId));
  const slug = rows[0]?.slug;
  if (slug === "tennis" || slug === "football") return slug;
  throw new CatalogError("unknown-ref", "The sport is not in the catalog");
}

async function writeRecord(db: CatalogDb, kind: CatalogWriteKind, value: unknown): Promise<void> {
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
      const athleteRows = await db
        .select({ sportSlug: athletes.sportSlug })
        .from(athletes)
        .where(eq(athletes.id, period.athleteId));
      const athleteSport = athleteRows[0]?.sportSlug;
      if (athleteSport === undefined) {
        throw new CatalogError("unknown-ref", "The athlete is not in the catalog");
      }
      if (athleteSport !== "football") {
        throw new CatalogError("not-football", "Club spells are for football athletes");
      }
      return insertRow(() => db.insert(athleteTeams).values({ ...period, athleteSport }));
    }
    case "user":
      return insertRow(() => db.insert(users).values(parseRecord(userSchema, value)));
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

async function readRecord(
  db: CatalogDb,
  kind: CatalogKind,
  key: string | AthleteTeamKey,
): Promise<Stored | undefined> {
  if (kind === "athleteTeam") {
    if (typeof key === "string") {
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

async function release(close: (() => Promise<void>) | undefined): Promise<void> {
  await close?.().catch(() => undefined);
}

function failed(code: CatalogErrorCode, message: string, cause: unknown): CatalogError {
  return new CatalogError(code, message, undefined, { cause });
}

export async function openCatalog(
  db: CatalogDb,
  options?: { close?: () => Promise<void> },
): Promise<Catalog> {
  try {
    await db.execute(sql.raw("SELECT 1"));
  } catch (error) {
    await release(options?.close);
    throw failed("unreachable", "Postgres is unreachable", error);
  }
  try {
    for (const statement of migrationStatements()) await db.execute(sql.raw(statement));
  } catch (error) {
    await release(options?.close);
    if (error instanceof CatalogError) throw error;
    throw failed("migration", "The catalog migration failed", error);
  }
  let closing: Promise<void> | undefined;
  return {
    write: (kind, value) => writeRecord(db, kind, value),
    read: (kind, key) => readRecord(db, kind, key),
    close: () => {
      closing ??= options?.close?.() ?? Promise.resolve();
      return closing;
    },
  };
}

export async function openPostgresCatalog(databaseUrl: string): Promise<Catalog> {
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 500,
    query_timeout: 500,
    max: 1,
  });
  pool.on("error", () => undefined);
  try {
    await pool.query("SELECT 1");
  } catch (error) {
    await pool.end().catch(() => undefined);
    throw failed("unreachable", "Postgres is unreachable", error);
  }
  return openCatalog(drizzlePg(pool, { schema }), { close: () => pool.end() });
}
