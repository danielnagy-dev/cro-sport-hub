import { z } from "zod";
import { idSchema } from "./common.ts";

/**
 * Both sides are clubs. A draw is a valid score. There is no winner column.
 */
export const footballMatchSchema = z
  .strictObject({
    matchId: idSchema,
    homeTeamId: idSchema,
    awayTeamId: idSchema,
    homeGoals: z.int().min(0).max(30),
    awayGoals: z.int().min(0).max(30),
  })
  .superRefine((match, ctx) => {
    if (match.homeTeamId === match.awayTeamId) {
      ctx.addIssue({
        code: "custom",
        path: ["awayTeamId"],
        message: "Home and away clubs must be different",
      });
    }
  });

export type FootballMatch = z.infer<typeof footballMatchSchema>;

/**
 * One tracked athlete in one football match.
 *
 * `yellowCards` is a count from 0 to 2, and `redCard` is a flag. The shared
 * `CardType` enum is for later display; it is not a column on this row.
 * Minutes stop at 130, which covers extra time and stoppage.
 * Zero minutes means the player did not take the pitch.
 */
export const appearanceSchema = z
  .strictObject({
    matchId: idSchema,
    athleteId: idSchema,
    teamId: idSchema,
    started: z.boolean(),
    minutes: z.int().min(0).max(130),
    goals: z.int().min(0).max(30),
    assists: z.int().min(0).max(30),
    yellowCards: z.int().min(0).max(2),
    redCard: z.boolean(),
  })
  .superRefine((appearance, ctx) => {
    for (const message of appearanceIssues(appearance)) {
      ctx.addIssue({ code: "custom", message });
    }
  });

export type Appearance = z.infer<typeof appearanceSchema>;

export type AppearanceCounts = {
  started: boolean;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCard: boolean;
};

export function appearanceIssues(appearance: AppearanceCounts): readonly string[] {
  if (appearance.minutes !== 0) {
    return [];
  }

  const issues: string[] = [];
  if (appearance.started) {
    issues.push("A player who started played at least one minute");
  }
  if (appearance.goals !== 0) {
    issues.push("A player with no minutes cannot have goals");
  }
  if (appearance.assists !== 0) {
    issues.push("A player with no minutes cannot have assists");
  }
  if (appearance.yellowCards !== 0) {
    issues.push("A player with no minutes cannot have a yellow card");
  }
  if (appearance.redCard) {
    issues.push("A player with no minutes cannot have a red card");
  }
  return issues;
}
