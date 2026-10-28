import { z } from 'zod'
import { idSchema, isoDateSchema, textSchema } from './common.ts'
import { roundSchema } from './match.ts'
import { tennisBestOfSchema, tennisSetSchema } from './tennis-score.ts'

const nameSchema = textSchema(80)
const listed = {
  id: idSchema,
  competition: textSchema(120),
  date: isoDateSchema,
  round: roundSchema,
}

/** A published result for the public list. Clubs are names, not team rows. */
export const publishedMatchSchema = z.discriminatedUnion('sport', [
  z.strictObject({
    ...listed,
    sport: z.literal('tennis'),
    playerA: nameSchema,
    playerB: nameSchema,
    winner: z.enum(['a', 'b']),
    bestOf: tennisBestOfSchema,
    score: z.array(tennisSetSchema).min(1).max(5),
    retired: z.boolean(),
  }),
  z.strictObject({
    ...listed,
    sport: z.literal('football'),
    homeTeam: nameSchema,
    awayTeam: nameSchema,
    homeGoals: z.int().min(0).max(30),
    awayGoals: z.int().min(0).max(30),
  }),
])

export const publishedMatchPageSchema = z.strictObject({
  items: z.array(publishedMatchSchema),
  limit: z.int().min(1).max(50),
  offset: z.int().min(0),
  total: z.int().min(0),
})

/** `limit` defaults to 20 at the handler. Offset defaults to 0. */
export const matchListQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(50),
  offset: z.coerce.number().int().min(0),
})

export type PublishedMatch = z.infer<typeof publishedMatchSchema>
export type PublishedMatchPage = z.infer<typeof publishedMatchPageSchema>
