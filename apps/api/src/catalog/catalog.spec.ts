import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { describe, expect, it } from "vite-plus/test";
import { openCatalog, openPostgresCatalog, type CatalogWriteKind } from "./catalog.js";
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

function memory() {
  return openCatalog(drizzle(new PGlite(), { schema }));
}

describe("v1 catalog", () => {
  it("seeds tennis and football once", async () => {
    const db = drizzle(new PGlite(), { schema });
    const first = await openCatalog(db);
    const second = await openCatalog(db);
    expect(await first.read("sport", "sport-tennis")).toEqual(tennis);
    expect(await second.read("sport", "sport-football")).toEqual(football);
    expect(await second.read("sport", "sport-basketball")).toBeUndefined();
  });

  it("round-trips a competition, a club, an athlete, a club spell, and an editor", async () => {
    const catalog = await memory();
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

  it("rejects a repeat, a tennis club, a national team, a viewer, and a bad spell", async () => {
    const catalog = await memory();
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

  it("reports a closed Postgres port as unreachable", async () => {
    await expect(
      openPostgresCatalog("postgresql://cro_sport:closed-port-password@127.0.0.1:1/cro_sport"),
    ).rejects.toMatchObject({ code: "unreachable" });
  });
});
