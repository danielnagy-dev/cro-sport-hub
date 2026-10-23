import { z } from "zod";
import { type FieldIssue, idSchema } from "./common.ts";

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
 * Two yellows require the red-card flag, because a second yellow is a
 * sending-off. The fields stay separate.
 * Minutes stop at 130, which covers extra time and stoppage.
 * Zero minutes means the player did not play, so they cannot have started
 * or recorded a goal or an assist. A booking or a sending-off from the
 * bench is still allowed.
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
    for (const issue of appearanceIssues(appearance)) {
      ctx.addIssue({ code: "custom", path: [...issue.path], message: issue.message });
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

export function appearanceIssues(appearance: AppearanceCounts): readonly FieldIssue[] {
  const issues: FieldIssue[] = [];

  if (appearance.minutes === 0) {
    if (appearance.started) {
      issues.push({
        path: ["started"],
        message: "A player who started played at least one minute",
      });
    }
    if (appearance.goals !== 0) {
      issues.push({
        path: ["goals"],
        message: "A player with no minutes cannot have goals",
      });
    }
    if (appearance.assists !== 0) {
      issues.push({
        path: ["assists"],
        message: "A player with no minutes cannot have assists",
      });
    }
  }

  if (appearance.yellowCards === 2 && !appearance.redCard) {
    issues.push({
      path: ["redCard"],
      message: "A second yellow card is a sending-off",
    });
  }

  return issues;
}
