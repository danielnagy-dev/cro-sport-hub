import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { describe, expect, it } from "vite-plus/test";
import { openCatalog, type Catalog } from "./catalog.js";
import { seedCatalog } from "./seed.js";
import * as schema from "./schema.js";

const counts = {
  aces: 1,
  doubleFaults: 0,
  firstServeIn: 4,
  firstServeTotal: 6,
  firstServePointsWon: 3,
  secondServePointsWon: 1,
  secondServeTotal: 2,
  breakPointsSaved: 1,
  breakPointsFaced: 2,
  breakPointsWon: 1,
  breakPointsTotal: 3,
  totalPointsWon: 8,
};
const played = {
  athleteId: "karlo-brkic",
  teamId: "club-sample-home",
  started: true,
  minutes: 90,
  goals: 1,
  assists: 0,
  yellowCards: 0,
  redCard: false,
};

function tennisBody(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    competitionId: "comp-sample-cup",
    date: "2026-10-20",
    round: "Semi-final",
    playerAId: "sample-player-a",
    playerBId: "sample-player-b",
    winnerId: "sample-player-a",
    bestOf: 3,
    score: [
      [6, 4],
      [6, 3],
    ],
    retired: false,
    ...extra,
  };
}

function footballBody(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    competitionId: "comp-sample-league",
    date: "2026-10-20",
    round: "Matchday 11",
    homeTeamId: "club-sample-home",
    awayTeamId: "club-sample-away",
    homeGoals: 2,
    awayGoals: 0,
    ...extra,
  };
}

async function seeded(): Promise<Catalog> {
  const client = new PGlite();
  const catalog = await openCatalog(drizzle(client, { schema }), {
    close: () => client.close(),
  });
  await seedCatalog(catalog);
  return catalog;
}

describe("saveDraft", () => {
  it("stores raw tennis counts and rejects a bad score, a percentage, and a repeated athlete", async () => {
    const catalog = await seeded();
    try {
      const id = "match-draft-rally";
      const editor = "editor-demo";
      await expect(
        catalog.saveDraft(
          "tennis",
          tennisBody(id, {
            score: [
              [7, 6],
              [6, 4],
            ],
          }),
          editor,
          "create",
        ),
      ).rejects.toMatchObject({
        issues: [
          {
            message: "A 7-6 set needs the tiebreak points scored by the player who lost the set",
          },
        ],
      });
      await expect(
        catalog.saveDraft(
          "tennis",
          tennisBody(id, {
            stats: [{ ...counts, athleteId: "sample-player-a", firstServePct: 60 }],
          }),
          editor,
          "create",
        ),
      ).rejects.toMatchObject({ issues: [{ message: 'Unrecognized key: "firstServePct"' }] });
      await expect(
        catalog.saveDraft("tennis", tennisBody(id, { status: "published" }), editor, "create"),
      ).rejects.toMatchObject({ issues: [{ message: 'Unrecognized key: "status"' }] });
      await expect(
        catalog.saveDraft(
          "tennis",
          tennisBody(id, { stats: [{ ...counts, athleteId: "sample-player-c" }] }),
          editor,
          "create",
        ),
      ).rejects.toMatchObject({ message: "Stats belong to one of the two players" });
      await expect(
        catalog.saveDraft(
          "tennis",
          tennisBody(id, {
            stats: [
              { ...counts, athleteId: "sample-player-a" },
              { ...counts, athleteId: "sample-player-a" },
            ],
          }),
          editor,
          "create",
        ),
      ).rejects.toMatchObject({ message: "Each athlete is listed once" });
      expect(await catalog.read("match", id)).toBeUndefined();

      await expect(
        catalog.saveDraft(
          "tennis",
          tennisBody(id, { stats: [{ ...counts, athleteId: "sample-player-a" }] }),
          editor,
          "create",
        ),
      ).resolves.toEqual({ id, status: "draft", sport: "tennis" });
      expect(await catalog.read("match", id)).toMatchObject({
        status: "draft",
        source: "manual",
        createdBy: editor,
      });
      expect(
        await catalog.read("tennisMatchStats", { matchId: id, athleteId: "sample-player-a" }),
      ).toEqual({ matchId: id, athleteId: "sample-player-a", ...counts });
      await expect(
        catalog.saveDraft("tennis", tennisBody(id), editor, "create"),
      ).rejects.toMatchObject({
        code: "conflict",
        message: "That record is already stored",
      });
      expect(
        JSON.stringify(await catalog.listPublishedMatches({ limit: 20, offset: 0 })),
      ).not.toContain(id);
    } finally {
      await catalog.close();
    }
  });

  it("stores a football draft and returns a published match to draft", async () => {
    const catalog = await seeded();
    try {
      const id = "match-draft-kick";
      await expect(
        catalog.saveDraft(
          "football",
          footballBody(id, { appearances: [{ ...played, started: false, minutes: 0, goals: 1 }] }),
          "admin-demo",
          "create",
        ),
      ).rejects.toMatchObject({
        issues: [{ message: "A player with no minutes cannot have goals" }],
      });
      expect(await catalog.read("match", id)).toBeUndefined();
      await expect(
        catalog.saveDraft(
          "football",
          footballBody(id, { appearances: [played] }),
          "admin-demo",
          "create",
        ),
      ).resolves.toEqual({ id, status: "draft", sport: "football" });
      expect(await catalog.read("match", id)).toMatchObject({
        status: "draft",
        createdBy: "admin-demo",
      });
      expect(
        await catalog.read("appearance", { matchId: id, athleteId: "karlo-brkic" }),
      ).toMatchObject({
        minutes: 90,
        goals: 1,
      });

      await expect(
        catalog.saveDraft(
          "tennis",
          tennisBody("match-sample-final", {
            date: "2026-10-18",
            round: "Final",
            score: [
              [6, 2],
              [6, 1],
            ],
            stats: [{ ...counts, aces: 2, athleteId: "sample-player-a" }],
          }),
          "editor-demo",
          "update",
        ),
      ).resolves.toEqual({ id: "match-sample-final", status: "draft", sport: "tennis" });
      expect(await catalog.read("match", "match-sample-final")).toMatchObject({
        status: "draft",
        createdBy: "editor-demo",
      });
      expect(await catalog.read("match", "match-sample-final")).not.toHaveProperty("reviewedBy");
      expect(await catalog.read("match", "match-sample-final")).not.toHaveProperty("publishedAt");
      expect(
        await catalog.read("tennisMatchStats", {
          matchId: "match-sample-final",
          athleteId: "sample-player-b",
        }),
      ).toBeUndefined();

      await expect(
        catalog.saveDraft(
          "football",
          footballBody("match-sample-league", {
            date: "2026-10-19",
            round: "Matchday 8",
            homeGoals: 3,
            awayGoals: 0,
            appearances: [played],
          }),
          "editor-demo",
          "update",
        ),
      ).resolves.toEqual({ id: "match-sample-league", status: "draft", sport: "football" });
      expect(await catalog.read("footballMatch", "match-sample-league")).toMatchObject({
        homeGoals: 3,
        awayGoals: 0,
      });
      expect(
        await catalog.read("appearance", {
          matchId: "match-sample-league",
          athleteId: "filip-saric",
        }),
      ).toBeUndefined();
      const listed = JSON.stringify(await catalog.listPublishedMatches({ limit: 20, offset: 0 }));
      expect(listed).not.toContain("match-sample-final");
      expect(listed).not.toContain("match-sample-league");
    } finally {
      await catalog.close();
    }
  });
});
