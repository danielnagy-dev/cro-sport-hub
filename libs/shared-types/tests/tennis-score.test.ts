import { expect, test } from "vite-plus/test";
import { evaluateTennisScore, tennisMatchSchema } from "../src/index.ts";

const specExample = [
  [6, 4],
  [3, 6],
  [7, 6, 5],
] as const;

test("accepts the spec's best-of-3 example and the player who won two sets", () => {
  const parsed = tennisMatchSchema.parse({
    matchId: "match-1",
    playerAId: "player-a",
    playerBId: "player-b",
    winnerId: "player-a",
    bestOf: 3,
    score: specExample,
  });

  expect(parsed.score).toEqual([
    [6, 4],
    [3, 6],
    [7, 6, 5],
  ]);
  expect(evaluateTennisScore(specExample, 3, false)).toEqual({
    ok: true,
    setsWonByA: 2,
    setsWonByB: 1,
  });
});

test("accepts a straight-sets best-of-3 and a best-of-5 from 3-0 to 3-2", () => {
  expect(
    evaluateTennisScore(
      [
        [6, 0],
        [6, 1],
      ],
      3,
      false,
    ).ok,
  ).toBe(true);
  expect(
    evaluateTennisScore(
      [
        [0, 6],
        [1, 6],
      ],
      3,
      false,
    ),
  ).toMatchObject({
    ok: true,
    setsWonByA: 0,
    setsWonByB: 2,
  });
  expect(
    evaluateTennisScore(
      [
        [6, 4],
        [6, 4],
        [6, 4],
      ],
      5,
      false,
    ),
  ).toMatchObject({
    ok: true,
    setsWonByA: 3,
  });
  expect(
    evaluateTennisScore(
      [
        [6, 4],
        [4, 6],
        [6, 4],
        [6, 4],
      ],
      5,
      false,
    ).ok,
  ).toBe(true);
  expect(
    evaluateTennisScore(
      [
        [7, 6, 0],
        [6, 7, 8],
        [7, 5],
        [5, 7],
        [6, 7, 18],
      ],
      5,
      false,
    ),
  ).toMatchObject({ ok: true, setsWonByA: 2, setsWonByB: 3 });
});

function invalidScore(
  score: readonly (readonly number[])[],
  bestOf: 3 | 5,
  retired = false,
): string {
  const result = evaluateTennisScore(score, bestOf, retired);
  if (result.ok) {
    return "";
  }
  return result.message;
}

test("rejects sets that are not finished, not a tiebreak, or played too late", () => {
  expect(invalidScore([[6, 5]], 3)).toBe(
    "An unfinished set is only allowed when the match is retired",
  );
  expect(invalidScore([[7, 6]], 3)).toBe(
    "A 7-6 set needs the tiebreak points scored by the player who lost the set",
  );
  expect(invalidScore([[6, 4, 2]], 3)).toBe("Tiebreak points belong only on a 7-6 set");
  expect(invalidScore([[7, 4]], 3)).toBe(
    "A set must be 6-0 to 6-4, 7-5, or 7-6 with the loser's tiebreak points",
  );
  expect(invalidScore([[8, 6]], 3)).toBe(
    "A set must be 6-0 to 6-4, 7-5, or 7-6 with the loser's tiebreak points",
  );
  expect(invalidScore([[7, 6, 100]], 3)).toBe("Tiebreak points are a whole number from 0 to 99");
  expect(
    invalidScore(
      [
        [6, 4],
        [6, 3],
        [6, 2],
      ],
      3,
    ),
  ).toBe("A set was played after the match was already decided");
  expect(
    invalidScore(
      [
        [6, 4],
        [3, 6],
      ],
      3,
    ),
  ).toBe("A best-of-3 match needs a player to win 2 sets");
  expect(
    invalidScore(
      [
        [6, 4],
        [6, 4],
      ],
      5,
    ),
  ).toBe("A best-of-5 match needs a player to win 3 sets");
  expect(invalidScore([], 3)).toBe("A tennis score needs at least one set");
});

test("allows a retirement in an unfinished set and rejects a finished one", () => {
  expect(
    evaluateTennisScore(
      [
        [6, 4],
        [3, 2],
      ],
      3,
      true,
    ),
  ).toMatchObject({
    ok: true,
    setsWonByA: 1,
    setsWonByB: 0,
  });
  expect(evaluateTennisScore([[6, 4]], 3, true)).toMatchObject({
    ok: true,
    setsWonByA: 1,
    setsWonByB: 0,
  });
  expect(evaluateTennisScore([[0, 0]], 3, true).ok).toBe(true);
  expect(evaluateTennisScore([[6, 6]], 5, true).ok).toBe(true);
  expect(
    invalidScore(
      [
        [6, 4],
        [6, 3],
      ],
      3,
      true,
    ),
  ).toBe("A finished match cannot be marked retired");
  expect(invalidScore([[3, 2]], 3)).toBe(
    "An unfinished set is only allowed when the match is retired",
  );
});

test("checks the winner, the two players, and best of", () => {
  const base = {
    matchId: "match-1",
    playerAId: "player-a",
    playerBId: "player-b",
    winnerId: "player-b",
    bestOf: 3,
    score: [
      [6, 4],
      [6, 3],
    ],
  };

  expect(tennisMatchSchema.safeParse(base).success).toBe(false);
  expect(tennisMatchSchema.safeParse({ ...base, winnerId: "player-a" }).success).toBe(true);
  expect(
    tennisMatchSchema.safeParse({ ...base, playerBId: "player-a", winnerId: "player-a" }).success,
  ).toBe(false);
  expect(tennisMatchSchema.safeParse({ ...base, winnerId: "player-c" }).success).toBe(false);
  expect(tennisMatchSchema.safeParse({ ...base, bestOf: 1, winnerId: "player-a" }).success).toBe(
    false,
  );

  const retired = tennisMatchSchema.safeParse({
    ...base,
    winnerId: "player-b",
    retired: true,
    score: [
      [6, 4],
      [2, 3],
    ],
  });
  expect(retired.success).toBe(true);
});
