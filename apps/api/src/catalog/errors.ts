import {
  appearanceSchema,
  athleteSchema,
  athleteTeamSchema,
  competitionSchema,
  footballMatchSchema,
  matchSchema,
  sportSchema,
  teamSchema,
  tennisMatchSchema,
  tennisMatchStatsSchema,
  type AthleteName,
  type AthleteTeam,
  type FieldIssue,
  type PublicAthlete,
  type PublishedMatchPage,
  type Role,
} from "@cro-sport-hub/shared-types";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { z } from "zod";
import type { PublishedMatchQuery } from "./published-matches.js";
import type * as schema from "./schema.js";

export type CatalogUser = { id: string; role: Role };
export type CatalogWriteKind =
  | "competition"
  | "team"
  | "athlete"
  | "athleteTeam"
  | "user"
  | "match"
  | "tennisMatch"
  | "tennisMatchStats"
  | "footballMatch"
  | "appearance";
export type CatalogKind = "sport" | CatalogWriteKind;
export type AthleteTeamKey = Pick<AthleteTeam, "athleteId" | "teamId" | "from">;
export type CatalogParticipantKey = { matchId: string; athleteId: string };
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

export type Stored =
  | z.output<typeof sportSchema>
  | z.output<typeof competitionSchema>
  | z.output<typeof teamSchema>
  | z.output<typeof athleteSchema>
  | z.output<typeof athleteTeamSchema>
  | z.output<typeof matchSchema>
  | z.output<typeof tennisMatchSchema>
  | z.output<typeof tennisMatchStatsSchema>
  | z.output<typeof footballMatchSchema>
  | z.output<typeof appearanceSchema>
  | CatalogUser;

export type Catalog = {
  write(kind: CatalogWriteKind, value: unknown): Promise<void>;
  read(
    kind: CatalogKind,
    key: string | AthleteTeamKey | CatalogParticipantKey,
  ): Promise<Stored | undefined>;
  listPublishedMatches(query: PublishedMatchQuery): Promise<PublishedMatchPage>;
  readPublicAthlete(slug: string): Promise<PublicAthlete>;
  listPublicAthletes(sport: string): Promise<AthleteName[]>;
  saveDraft(
    sport: "tennis" | "football",
    body: unknown,
    actorId: string,
    mode: "create" | "update",
  ): Promise<{ id: string; status: "draft"; sport: "tennis" | "football" }>;
  close(): Promise<void>;
};

export type CatalogDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export function invalidRecord(error: z.ZodError): never {
  throw new CatalogError(
    "invalid",
    "The record does not match the shared schema",
    error.issues.map((issue) => ({ path: issue.path.map(String), message: issue.message })),
    { cause: error },
  );
}

export function parseRecord<T>(
  parser: { safeParse: (value: unknown) => z.ZodSafeParseResult<T> },
  value: unknown,
): T {
  const result = parser.safeParse(value);
  if (result.success) return result.data;
  return invalidRecord(result.error);
}
