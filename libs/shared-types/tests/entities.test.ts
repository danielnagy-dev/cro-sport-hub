import { expect, test } from "vite-plus/test";
import {
  appearanceIssues,
  appearanceSchema,
  athleteSchema,
  athleteTeamSchema,
  cardTypeSchema,
  competitionSchema,
  footballMatchSchema,
  matchSchema,
  roleSchema,
  sportSchema,
  statusSchema,
  teamSchema,
} from "../src/index.ts";

test("parses the shared enums and rejects values outside them", () => {
  expect(statusSchema.parse("published")).toBe("published");
  expect(statusSchema.safeParse("approved").success).toBe(false);
  expect(roleSchema.parse("editor")).toBe("editor");
  expect(roleSchema.safeParse("viewer").success).toBe(false);
  expect(sportSchema.parse({ id: "sport-tennis", slug: "tennis", name: "Tennis" }).slug).toBe(
    "tennis",
  );
  expect(
    sportSchema.safeParse({ id: "sport-x", slug: "basketball", name: "Basketball" }).success,
  ).toBe(false);
  expect(cardTypeSchema.parse("yellow")).toBe("yellow");
  expect(cardTypeSchema.parse("red")).toBe("red");
  expect(cardTypeSchema.safeParse("blue").success).toBe(false);
});

test("parses athletes, clubs, club spells, and competitions", () => {
  expect(
    athleteSchema.parse({
      id: "player-one",
      slug: "player-one",
      name: "Player One",
      sportId: "sport-football",
      country: "HR",
      birthYear: 1998,
      position: "Midfielder",
      photoUrl: "https://example.com/player.png",
    }).photoUrl,
  ).toBe("https://example.com/player.png");

  expect(
    athleteSchema.safeParse({
      id: "player-one",
      slug: "Player One",
      name: " Player One",
      sportId: "sport-football",
      country: "Croatia",
      birthYear: 2020,
      photoUrl: "http://example.com/photo.png",
    }).success,
  ).toBe(false);

  expect(
    teamSchema.parse({
      id: "club-north",
      sportId: "sport-football",
      slug: "club-north",
      name: "Club North",
      shortName: "CN",
      country: "HR",
    }).crestUrl,
  ).toBeUndefined();
  expect(
    teamSchema.safeParse({
      id: "club-north",
      sportId: "sport-football",
      slug: "club-north",
      name: "Club North",
      shortName: "CN",
      country: "HR",
      nationalTeam: true,
    }).success,
  ).toBe(false);

  expect(
    athleteTeamSchema.parse({
      athleteId: "player-one",
      teamId: "club-north",
      from: "2024-07-01",
    }).to,
  ).toBeUndefined();
  expect(
    athleteTeamSchema.safeParse({
      athleteId: "player-one",
      teamId: "club-north",
      from: "2024-07-01",
      to: "2024-06-30",
    }).success,
  ).toBe(false);
  expect(
    athleteTeamSchema.safeParse({
      athleteId: "player-one",
      teamId: "club-north",
      from: "2023-02-29",
      to: "2024-02-29",
    }).success,
  ).toBe(false);

  expect(
    competitionSchema.parse({
      id: "comp-city",
      sportId: "sport-tennis",
      name: "City Open 2026",
      season: "2026",
      level: "international",
    }).level,
  ).toBe("international");
  expect(
    competitionSchema.parse({
      id: "comp-league",
      sportId: "sport-football",
      name: "National League",
      season: "2026/27",
      level: "domestic",
    }).season,
  ).toBe("2026/27");
  expect(
    competitionSchema.parse({
      id: "comp-old",
      sportId: "sport-football",
      name: "National League",
      season: "1999/00",
      level: "domestic",
    }).season,
  ).toBe("1999/00");
  expect(
    competitionSchema.safeParse({
      id: "comp-league",
      sportId: "sport-football",
      name: "National League",
      season: "2026/28",
      level: "friendly",
    }).success,
  ).toBe(false);
});

function draftMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: "match-1",
    sportId: "sport-football",
    competitionId: "comp-league",
    date: "2026-10-23",
    round: "Matchday 8",
    status: "draft",
    source: "manual",
    createdBy: "editor-1",
    ...overrides,
  };
}

test("enforces the match workflow and the import source ref", () => {
  expect(matchSchema.parse(draftMatch()).status).toBe("draft");
  expect(matchSchema.safeParse(draftMatch({ reviewedBy: "editor-2" })).success).toBe(false);
  expect(matchSchema.safeParse(draftMatch({ source: "import" })).success).toBe(false);
  expect(matchSchema.safeParse(draftMatch({ sourceRef: "fixture-1" })).success).toBe(false);
  expect(
    matchSchema.parse(draftMatch({ source: "import", sourceRef: "fixture-1" })).sourceRef,
  ).toBe("fixture-1");

  const published = draftMatch({
    status: "published",
    reviewedBy: "editor-2",
    publishedAt: "2026-10-23T18:04:00+02:00",
  });
  expect(matchSchema.parse(published).publishedAt).toBe("2026-10-23T18:04:00+02:00");
  expect(
    matchSchema.safeParse(draftMatch({ status: "published", reviewedBy: "editor-2" })).success,
  ).toBe(false);
  expect(
    matchSchema.safeParse(
      draftMatch({ status: "review", publishedAt: "2026-10-23T18:04:00+02:00" }),
    ).success,
  ).toBe(false);
  expect(matchSchema.safeParse(draftMatch({ date: "2026-02-31" })).success).toBe(false);
});

test("parses football scores and appearance rules", () => {
  expect(
    footballMatchSchema.parse({
      matchId: "match-1",
      homeTeamId: "club-north",
      awayTeamId: "club-south",
      homeGoals: 1,
      awayGoals: 1,
    }),
  ).toMatchObject({ homeGoals: 1, awayGoals: 1 });
  expect(
    footballMatchSchema.safeParse({
      matchId: "match-1",
      homeTeamId: "club-north",
      awayTeamId: "club-north",
      homeGoals: 0,
      awayGoals: -1,
    }).success,
  ).toBe(false);

  const substitute = appearanceSchema.parse({
    matchId: "match-1",
    athleteId: "player-one",
    teamId: "club-north",
    started: false,
    minutes: 30,
    goals: 1,
    assists: 0,
    yellowCards: 1,
    redCard: false,
  });
  expect(substitute.started).toBe(false);
  expect(appearanceIssues({ ...substitute, minutes: 0, goals: 0, yellowCards: 0 })).toEqual([]);
  expect(
    appearanceIssues({
      started: true,
      minutes: 0,
      goals: 1,
      assists: 0,
      yellowCards: 0,
      redCard: false,
    }),
  ).toEqual([
    "A player who started played at least one minute",
    "A player with no minutes cannot have goals",
  ]);
  expect(
    appearanceSchema.safeParse({
      matchId: "match-1",
      athleteId: "player-one",
      teamId: "club-north",
      started: false,
      minutes: 90,
      goals: 0,
      assists: 0,
      yellowCards: 3,
      redCard: false,
    }).success,
  ).toBe(false);
  expect(
    appearanceSchema.safeParse({
      matchId: "match-1",
      athleteId: "player-one",
      teamId: "club-north",
      started: false,
      minutes: 131,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCard: true,
    }).success,
  ).toBe(false);
});
