import {
  editorMatchPageSchema,
  editorMatchSchema,
  type EditorMatch,
  type EditorMatchListQuery,
  type EditorMatchPage,
} from "@cro-sport-hub/shared-types";
import { and, count, eq, type SQL } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { z } from "zod";
import { selectListedMatches } from "./published-matches.js";
import * as schema from "./schema.js";

const { matches } = schema;
type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>;
type ListedRow = Awaited<ReturnType<typeof selectListedMatches>>[number];

/** Drafts included. Newest `match_date` first, then `id`. */
export async function listEditorMatches(
  db: CatalogDb,
  query: EditorMatchListQuery,
): Promise<EditorMatchPage> {
  const filter = editorFilter(query);
  const [counted, rows] = await Promise.all([
    db.select({ total: count() }).from(matches).where(filter),
    selectListedMatches(db, filter, query.limit, query.offset),
  ]);
  return editorMatchPageSchema.parse({
    items: rows.map((row) => toEditor(row)),
    limit: query.limit,
    offset: query.offset,
    total: z
      .int()
      .nonnegative()
      .parse(Number(counted[0]?.total ?? 0)),
  });
}

function editorFilter(query: EditorMatchListQuery): SQL | undefined {
  const parts = [
    query.sport === undefined ? undefined : eq(matches.sportSlug, query.sport),
    query.status === undefined ? undefined : eq(matches.status, query.status),
    query.source === undefined ? undefined : eq(matches.source, query.source),
  ].filter((part): part is SQL => part !== undefined);
  return parts.length === 0 ? undefined : and(...parts);
}

function side(name: string | null): string {
  if (name === null || name.length === 0) throw new Error("A listed match is missing a side");
  return name;
}

function toEditor(row: ListedRow): EditorMatch {
  const label =
    row.sportSlug === "tennis"
      ? `${side(row.playerA)} vs ${side(row.playerB)}`
      : `${side(row.homeTeam)} vs ${side(row.awayTeam)}`;
  return editorMatchSchema.parse({
    id: row.id,
    sport: row.sportSlug,
    competition: row.competition,
    date: row.date,
    round: row.round,
    status: row.status,
    source: row.source,
    label,
  });
}
