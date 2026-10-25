import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { ZodError } from "zod";
import { describe, expect, it } from "vite-plus/test";
import {
  CatalogError,
  openCatalog,
  openPostgresCatalog,
  type Catalog,
  type CatalogWriteKind,
} from "./catalog.js";
import * as schema from "./schema.js";

const tennis = { id: "sport-tennis", slug: "tennis", name: "Tennis" };
const football = { id: "sport-football", slug: "football", name: "Football" };
const competition = {
  id: "comp-city",
  sportId: "sport-tennis",
  name: "City Open 2026",
  season: "2026",
  level: "international",
};
const club = {
  id: "club-north",
  sportId: "sport-football",
  slug: "club-north",
  name: "Club North",
  shortName: "CN",
  country: "HR",
};
const player = {
  id: "player-one",
  slug: "player-one",
  name: "Player One",
  sportId: "sport-football",
  country: "HR",
  photoUrl: "https://example.com/player.png",
};
const spell = {
  athleteId: "player-one",
  teamId: "club-north",
  from: "2024-07-01",
  to: "2025-06-30",
};
const editor = { id: "editor-1", role: "editor" as const };

function openMemory(client: PGlite, owner = true) {
  return openCatalog(
    drizzle(client, { schema }),
    owner ? { close: () => client.close() } : undefined,
  );
}

async function rejected(run: Promise<unknown>): Promise<unknown> {
  return run.then(
    () => {
      throw new Error("Expected a rejection");
    },
    (caught: unknown) => caught,
  );
}

function zodCause(error: unknown): ZodError {
  if (!(error instanceof CatalogError) || !(error.cause instanceof ZodError)) {
    throw new Error("Expected a CatalogError caused by ZodError");
  }
  return error.cause;
}

async function withMemory(check: (catalog: Catalog) => Promise<void>): Promise<void> {
  const client = new PGlite();
  const catalog = await openMemory(client);
  try {
    await check(catalog);
  } finally {
    await catalog.close();
  }
}

describe("v1 catalog", () => {
  it("seeds tennis and football once", async () => {
    const client = new PGlite();
    const first = await openMemory(client);
    try {
      const second = await openMemory(client, false);
      expect(await first.read("sport", "sport-tennis")).toEqual(tennis);
      expect(await second.read("sport", "sport-football")).toEqual(football);
      expect(await second.read("sport", "sport-basketball")).toBeUndefined();
      await second.close();
    } finally {
      await first.close();
    }
  });

  it("round-trips a competition, a club, an athlete, a club spell, and an editor", async () => {
    await withMemory(async (catalog) => {
      await catalog.write("competition", competition);
      await catalog.write("team", club);
      await catalog.write("athlete", player);
      await catalog.write("athleteTeam", spell);
      await catalog.write("user", editor);
      expect(await catalog.read("competition", competition.id)).toEqual(competition);
      expect(await catalog.read("team", club.id)).toEqual(club);
      expect(await catalog.read("athlete", player.id)).toEqual(player);
      expect(await catalog.read("athleteTeam", spell)).toEqual(spell);
      expect(await catalog.read("user", editor.id)).toEqual(editor);
    });
  });

  it("rejects a repeat, a tennis club, a national team, a viewer, and a bad spell", async () => {
    await withMemory(async (catalog) => {
      const tennisClub = { ...club, id: "club-ace", slug: "club-ace", sportId: "sport-tennis" };
      const tennisPlayer = {
        ...player,
        id: "player-ace",
        slug: "player-ace",
        sportId: "sport-tennis",
      };
      await catalog.write("team", club);
      await catalog.write("athlete", player);
      await catalog.write("athlete", tennisPlayer);
      const rejected: [CatalogWriteKind, unknown, string][] = [
        ["team", club, "conflict"],
        ["team", tennisClub, "not-football"],
        ["team", { ...club, nationalTeam: true }, "invalid"],
        ["user", { id: "editor-2", role: "viewer" }, "invalid"],
        ["athleteTeam", { ...spell, athleteId: tennisPlayer.id }, "not-football"],
        ["athleteTeam", { ...spell, teamId: "club-missing" }, "unknown-ref"],
        ["athleteTeam", { ...spell, to: "2024-06-30" }, "invalid"],
      ];
      for (const [kind, value, code] of rejected) {
        await expect(catalog.write(kind, value)).rejects.toMatchObject({ code });
      }
    });
  });

  it("reports a migration failure after SELECT 1 as its own error", async () => {
    const client = new PGlite();
    await client.exec("CREATE TABLE sports (id text PRIMARY KEY)");
    const opening = openMemory(client);
    try {
      await expect(opening).rejects.toThrow(/^The catalog migration failed$/);
      await expect(opening).rejects.toMatchObject({
        name: "CatalogError",
        code: "migration",
        message: "The catalog migration failed",
      });
      const error = await rejected(opening);
      expect(error).toBeInstanceOf(CatalogError);
      if (
        !(error instanceof CatalogError) ||
        !(error.cause instanceof Error) ||
        !(error.cause.cause instanceof Error)
      ) {
        throw new Error("Expected the migration error to keep the database error");
      }
      expect(error.cause.cause.message).toBe(
        'column "slug" referenced in foreign key constraint does not exist',
      );
      expect(client.closed).toBe(true);
    } finally {
      if (!client.closed) await client.close();
    }
  });

  it("closes the PGLite database", async () => {
    const client = new PGlite();
    const catalog = await openMemory(client);
    try {
      await catalog.close();
      await catalog.close();
      expect(client.closed).toBe(true);
      await expect(client.query("select 1")).rejects.toThrow(/^PGlite is closed$/);
    } finally {
      if (!client.closed) await client.close();
    }
  });

  it("wraps a shared-schema parse failure and keeps the parser error", async () => {
    const client = new PGlite();
    const catalog = await openMemory(client);
    try {
      await client.exec(
        "UPDATE sports SET name = 'Tennis name that is definitely over forty chars' WHERE id = 'sport-tennis'",
      );
      const read = catalog.read("sport", "sport-tennis");
      await expect(read).rejects.toThrow(/^The record does not match the shared schema$/);
      await expect(read).rejects.toMatchObject({
        name: "CatalogError",
        code: "invalid",
        message: "The record does not match the shared schema",
        issues: [{ path: ["name"], message: "Too big: expected string to have <=40 characters" }],
      });
      const readError = zodCause(await rejected(read));
      expect(readError.issues[0]?.path).toEqual(["name"]);
      expect(readError.issues[0]?.message).toBe("Too big: expected string to have <=40 characters");

      const write = catalog.write("competition", { ...competition, season: "nope" });
      await expect(write).rejects.toThrow(/^The record does not match the shared schema$/);
      const written = zodCause(await rejected(write));
      expect(written.issues[0]?.message).toBe("Expected a season like 2026 or 2026/27");
    } finally {
      await catalog.close();
    }
  });

  it("reports a closed Postgres port as unreachable", async () => {
    const opening = openPostgresCatalog(
      "postgresql://cro_sport:closed-port-password@127.0.0.1:1/cro_sport",
    );
    await expect(opening).rejects.toThrow(/^Postgres is unreachable$/);
    await expect(opening).rejects.toMatchObject({
      name: "CatalogError",
      code: "unreachable",
      message: "Postgres is unreachable",
    });
  });
});
