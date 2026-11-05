import { z } from 'zod'
import { idSchema, isoDateSchema } from './common.ts'
import { statusSchema } from './enums.ts'
import { roundSchema } from './match.ts'
import { tennisBestOfSchema, tennisSetSchema } from './tennis-score.ts'
import { tennisStatCountsSchema } from './tennis-stats.ts'

const editorTennisDraftStatSchema = tennisStatCountsSchema.extend({
  athleteId: idSchema,
})

/** Editor GET body: the tennis draft POST shape plus workflow status. */
export const editorTennisDraftSchema = z.strictObject({
  id: idSchema,
  competitionId: idSchema,
  date: isoDateSchema,
  round: roundSchema,
  playerAId: idSchema,
  playerBId: idSchema,
  winnerId: idSchema,
  bestOf: tennisBestOfSchema,
  score: z.array(tennisSetSchema).min(1).max(5),
  retired: z.literal(true).optional(),
  stats: z.array(editorTennisDraftStatSchema).max(2).optional(),
  status: statusSchema,
})

export type EditorTennisDraft = z.infer<typeof editorTennisDraftSchema>
