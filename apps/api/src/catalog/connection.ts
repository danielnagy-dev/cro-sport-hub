import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import { saveDraft } from "./drafts.js";
import { selectAthletes, selectCompetitions, selectTeams } from "./editor-lookups.js";
import { listEditorMatches as readEditorMatches } from "./editor-matches.js";
import { rejectMatch, submitMatch } from "./workflow.js";
import {
  CatalogError,
  invalidRecord,
  type Catalog,
  type CatalogDb,
  type CatalogErrorCode,
} from "./errors.js";
import {
  listPublicAthletes as queryAthletes,
  readPublicAthlete as queryAthlete,
} from "./published-athletes.js";
import { listPublishedMatches } from "./published-matches.js";
import { readRecord, writeRecord } from "./records.js";
import * as schema from "./schema.js";
import { deleteTeam, listTeams, replaceTeam } from "./teams.js";

const migrationDir = dirname(fileURLToPath(import.meta.url));

function migrationStatements(): string[] {
  return [
    "0001_v1_catalog.sql",
    "0002_v1_matches.sql",
    "0003_v1_football.sql",
    "0004_v1_match_sport_index.sql",
    "0005_v1_credentials.sql",
  ].flatMap((name) =>
    readFileSync(join(migrationDir, name), "utf8")
      .replaceAll(/--.*$/gm, "")
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0),
  );
}

async function release(close: (() => Promise<void>) | undefined): Promise<void> {
  await close?.().catch(() => undefined);
}

function failed(code: CatalogErrorCode, message: string, cause: unknown): CatalogError {
  return new CatalogError(code, message, undefined, { cause });
}

function readParsed<T>(load: () => Promise<T>): Promise<T> {
  return load().catch((error: unknown) => {
    if (error instanceof z.ZodError) return invalidRecord(error);
    throw error;
  });
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
    listPublishedMatches: (query) => readParsed(() => listPublishedMatches(db, query)),
    listEditorMatches: (query) => readParsed(() => readEditorMatches(db, query)),
    readPublicAthlete: (slug) => readParsed(() => queryAthlete(db, slug)),
    listPublicAthletes: (sport) => readParsed(() => queryAthletes(db, sport)),
    listCompetitions: (sport) => readParsed(() => selectCompetitions(db, sport)),
    listAthletes: (sport) => readParsed(() => selectAthletes(db, sport)),
    listTeamLookups: () => readParsed(() => selectTeams(db)),
    saveDraft: (sport, body, actorId, mode) => saveDraft(db, sport, body, actorId, mode),
    submitMatch: (id) => submitMatch(db, id),
    rejectMatch: (id) => rejectMatch(db, id),
    listTeams: () => listTeams(db),
    replaceTeam: (value) => replaceTeam(db, value),
    deleteTeam: (id) => deleteTeam(db, id),
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
