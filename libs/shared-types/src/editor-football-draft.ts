import { z } from 'zod'
import { idSchema, isoDateSchema } from './common.ts'
import { statusSchema } from './enums.ts'
import { roundSchema } from './match.ts'

const editorFootballAppearanceSchema = z.strictObject({
  athleteId: idSchema,
  teamId: idSchema,
  started: z.boolean(),
  minutes: z.int().min(0).max(130),
  goals: z.int().min(0).max(30),
  assists: z.int().min(0).max(30),
  yellowCards: z.int().min(0).max(2),
  redCard: z.boolean(),
})

/** Editor GET body: the football draft POST shape plus workflow status. */
export const editorFootballDraftSchema = z.strictObject({
  id: idSchema,
  competitionId: idSchema,
  date: isoDateSchema,
  round: roundSchema,
  homeTeamId: idSchema,
  awayTeamId: idSchema,
  homeGoals: z.int().min(0).max(30),
  awayGoals: z.int().min(0).max(30),
  appearances: z.array(editorFootballAppearanceSchema).max(50).optional(),
  status: statusSchema,
})

export type EditorFootballDraft = z.infer<typeof editorFootballDraftSchema>
