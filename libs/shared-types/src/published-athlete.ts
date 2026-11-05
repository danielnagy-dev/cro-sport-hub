import { z } from 'zod'
import { birthYearSchema } from './athlete.ts'
import { countryCodeSchema, idSchema, isoDateSchema, slugSchema, textSchema } from './common.ts'
import { roundSchema } from './match.ts'
import { tennisBestOfSchema, tennisSetSchema } from './tennis-score.ts'
import { tennisPercentagesSchema, tennisStatCountsSchema } from './tennis-stats.ts'

const nameSchema = textSchema(80)
const competitionSchema = textSchema(120)

/** One club spell on a public profile. The club id stays in the catalog. */
export const publicClubSpellSchema = z.strictObject({
  name: nameSchema,
  from: isoDateSchema,
  to: isoDateSchema.optional(),
})

const profileFields = {
  slug: slugSchema,
  name: nameSchema,
  country: countryCodeSchema,
  birthYear: birthYearSchema.optional(),
  position: textSchema(40).optional(),
  clubs: z.array(publicClubSpellSchema),
}

const tennisResultListed = {
  id: idSchema,
  competition: competitionSchema,
  date: isoDateSchema,
  round: roundSchema,
  opponent: nameSchema,
  winner: z.enum(['athlete', 'opponent']),
  bestOf: tennisBestOfSchema,
  score: z.array(tennisSetSchema).min(1).max(5),
  retired: z.boolean(),
}

/** One published tennis match on an athlete profile. Percentages are computed, not stored. */
export const publicTennisResultSchema = z.union([
  z.strictObject({ ...tennisResultListed, percentages: z.null() }),
  z.strictObject({
    ...tennisResultListed,
    ...tennisStatCountsSchema.shape,
    percentages: tennisPercentagesSchema,
  }),
])

/** Football profiles omit `results`. Tennis profiles include published match rows. */
export const publicAthleteSchema = z.discriminatedUnion('sport', [
  z.strictObject({
    ...profileFields,
    sport: z.literal('football'),
  }),
  z.strictObject({
    ...profileFields,
    sport: z.literal('tennis'),
    results: z.array(publicTennisResultSchema),
  }),
])

/** A name in `GET /api/athletes?sport=`. */
export const athleteNameSchema = z.strictObject({
  slug: slugSchema,
  name: nameSchema,
})

export const athleteNameListSchema = z.array(athleteNameSchema)

export type PublicClubSpell = z.infer<typeof publicClubSpellSchema>
export type PublicTennisResult = z.infer<typeof publicTennisResultSchema>
export type PublicAthlete = z.infer<typeof publicAthleteSchema>
export type AthleteName = z.infer<typeof athleteNameSchema>
