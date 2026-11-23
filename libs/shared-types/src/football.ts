import { z } from 'zod'
import { type FieldIssue, idSchema } from './common.ts'

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
        code: 'custom',
        path: ['awayTeamId'],
        message: 'Home and away clubs must be different',
      })
    }
  })

export type FootballMatch = z.infer<typeof footballMatchSchema>

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
      ctx.addIssue({ code: 'custom', path: [...issue.path], message: issue.message })
    }
  })

export type Appearance = z.infer<typeof appearanceSchema>

export type AppearanceCounts = {
  started: boolean
  minutes: number
  goals: number
  assists: number
  yellowCards: number
  redCard: boolean
}

export function appearanceIssues(appearance: AppearanceCounts): readonly FieldIssue[] {
  const issues: FieldIssue[] = []

  if (appearance.minutes === 0) {
    if (appearance.started) {
      issues.push({
        path: ['started'],
        message: 'A player who started played at least one minute',
      })
    }
    if (appearance.goals !== 0) {
      issues.push({
        path: ['goals'],
        message: 'A player with no minutes cannot have goals',
      })
    }
    if (appearance.assists !== 0) {
      issues.push({
        path: ['assists'],
        message: 'A player with no minutes cannot have assists',
      })
    }
  }

  if (appearance.yellowCards === 2 && !appearance.redCard) {
    issues.push({
      path: ['redCard'],
      message: 'A second yellow card is a sending-off',
    })
  }

  return issues
}
