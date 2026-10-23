import { expect, test } from "vite-plus/test";
import { tennisMatchStatsSchema, tennisPercentages, tennisStatIssues } from "../src/index.ts";

function counts(overrides: Partial<Parameters<typeof tennisStatIssues>[0]> = {}) {
  return {
    aces: 3,
    doubleFaults: 1,
    firstServeIn: 6,
    firstServeTotal: 10,
    firstServePointsWon: 4,
    secondServePointsWon: 2,
    secondServeTotal: 4,
    breakPointsSaved: 1,
    breakPointsFaced: 2,
    breakPointsWon: 2,
    breakPointsTotal: 4,
    totalPointsWon: 20,
    ...overrides,
  };
}

function stats(overrides: Partial<Parameters<typeof tennisStatIssues>[0]> = {}) {
  return {
    matchId: "match-1",
    athleteId: "player-a",
    ...counts(overrides),
  };
}

test("accepts raw counts with and without optional winners", () => {
  expect(tennisMatchStatsSchema.parse(stats())).toMatchObject({ aces: 3 });
  expect(tennisStatIssues(counts()).length).toBe(0);

  const withOptional = tennisMatchStatsSchema.parse({
    ...stats(),
    winners: 8,
    unforcedErrors: 5,
  });
  expect(withOptional.winners).toBe(8);
  expect(withOptional.unforcedErrors).toBe(5);

  const zeros = counts({
    aces: 0,
    doubleFaults: 0,
    firstServeIn: 0,
    firstServeTotal: 0,
    firstServePointsWon: 0,
    secondServePointsWon: 0,
    secondServeTotal: 0,
    breakPointsSaved: 0,
    breakPointsFaced: 0,
    breakPointsWon: 0,
    breakPointsTotal: 0,
    totalPointsWon: 0,
  });
  expect(tennisStatIssues(zeros)).toEqual([]);
  expect(tennisMatchStatsSchema.safeParse(stats(zeros)).success).toBe(true);
});

test("rejects inconsistent serve and break-point counts", () => {
  expect(tennisStatIssues(counts({ firstServeIn: 11 }))).toContain(
    "First serves in cannot exceed first serves played",
  );
  expect(tennisStatIssues(counts({ firstServePointsWon: 7 }))).toContain(
    "First-serve points won cannot exceed first serves in",
  );
  expect(tennisStatIssues(counts({ secondServeTotal: 5 }))).toContain(
    "Second serves played must equal the first serves that missed",
  );
  expect(tennisStatIssues(counts({ secondServePointsWon: 5, doubleFaults: 0 }))).toContain(
    "Second-serve points won cannot exceed second serves played",
  );
  expect(tennisStatIssues(counts({ doubleFaults: 5, secondServePointsWon: 0 }))).toContain(
    "Double faults cannot exceed second serves played",
  );
  expect(tennisStatIssues(counts({ doubleFaults: 3, secondServePointsWon: 2 }))).toContain(
    "Second-serve points won cannot exceed second serves that landed in",
  );
  expect(tennisStatIssues(counts({ aces: 7 }))).toContain("Aces cannot exceed serve points won");
  expect(tennisStatIssues(counts({ totalPointsWon: 5 }))).toContain(
    "Total points won cannot be lower than serve points won",
  );
  expect(tennisStatIssues(counts({ breakPointsSaved: 3 }))).toContain(
    "Break points saved cannot exceed break points faced",
  );
  expect(tennisStatIssues(counts({ breakPointsFaced: 11, breakPointsSaved: 0 }))).toContain(
    "Break points faced cannot exceed service points played",
  );
  expect(tennisStatIssues(counts({ breakPointsWon: 5 }))).toContain(
    "Break points won cannot exceed break points played",
  );
  expect(tennisMatchStatsSchema.safeParse(stats({ firstServeIn: 11 })).success).toBe(false);
  expect(tennisMatchStatsSchema.safeParse({ ...stats(), firstServePct: 60 }).success).toBe(false);
  expect(tennisMatchStatsSchema.safeParse(stats({ aces: -1 })).success).toBe(false);
  expect(tennisMatchStatsSchema.safeParse(stats({ aces: 1.5 })).success).toBe(false);
});

test("computes percentages and returns null when a total is zero", () => {
  const result = tennisPercentages(counts());

  expect(result.firstServePct).toBe(60);
  expect(result.firstServePointsWonPct).toBeCloseTo((4 / 6) * 100);
  expect(result.secondServePointsWonPct).toBe(50);
  expect(result.breakPointsSavedPct).toBe(50);
  expect(result.breakPointsConvertedPct).toBe(50);

  const noneIn = tennisPercentages(
    counts({
      firstServeIn: 0,
      firstServeTotal: 4,
      firstServePointsWon: 0,
      secondServeTotal: 4,
      secondServePointsWon: 1,
      doubleFaults: 2,
      aces: 0,
      breakPointsSaved: 0,
      breakPointsFaced: 0,
      totalPointsWon: 1,
    }),
  );
  expect(noneIn.firstServePct).toBe(0);
  expect(noneIn.firstServePointsWonPct).toBeNull();
  expect(noneIn.secondServePointsWonPct).toBe(25);
  expect(noneIn.breakPointsSavedPct).toBeNull();

  const allZero = tennisPercentages(
    counts({
      aces: 0,
      doubleFaults: 0,
      firstServeIn: 0,
      firstServeTotal: 0,
      firstServePointsWon: 0,
      secondServePointsWon: 0,
      secondServeTotal: 0,
      breakPointsSaved: 0,
      breakPointsFaced: 0,
      breakPointsWon: 0,
      breakPointsTotal: 0,
      totalPointsWon: 0,
    }),
  );
  expect(allZero).toEqual({
    firstServePct: null,
    firstServePointsWonPct: null,
    secondServePointsWonPct: null,
    breakPointsSavedPct: null,
    breakPointsConvertedPct: null,
  });
});
