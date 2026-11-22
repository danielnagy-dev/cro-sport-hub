import { athleteSchema, sportSlugSchema, textSchema } from '@cro-sport-hub/shared-types'
import { z } from 'zod'

export const editorAthleteSchema = athleteSchema.extend({
  clubName: textSchema(80).optional(),
})

export type EditorAthlete = z.infer<typeof editorAthleteSchema>

export const editorAthleteListQuerySchema = z.strictObject({
  sport: sportSlugSchema,
  q: z.string().trim().min(1).max(80).optional(),
})

export type EditorAthleteListQuery = z.infer<typeof editorAthleteListQuerySchema>
