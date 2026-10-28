import { z } from 'zod'
import { birthYearSchema } from './athlete.ts'
import { countryCodeSchema, isoDateSchema, slugSchema, textSchema } from './common.ts'
import { sportSlugSchema } from './enums.ts'

const nameSchema = textSchema(80)

/** One club spell on a public profile. The club id stays in the catalog. */
export const publicClubSpellSchema = z.strictObject({
  name: nameSchema,
  from: isoDateSchema,
  to: isoDateSchema.optional(),
})

/** Public profile. Results are a later slice, so this object has none. */
export const publicAthleteSchema = z.strictObject({
  slug: slugSchema,
  name: nameSchema,
  sport: sportSlugSchema,
  country: countryCodeSchema,
  birthYear: birthYearSchema.optional(),
  position: textSchema(40).optional(),
  clubs: z.array(publicClubSpellSchema),
})

/** A name in `GET /api/athletes?sport=`. */
export const athleteNameSchema = z.strictObject({
  slug: slugSchema,
  name: nameSchema,
})

export const athleteNameListSchema = z.array(athleteNameSchema)

export type PublicClubSpell = z.infer<typeof publicClubSpellSchema>
export type PublicAthlete = z.infer<typeof publicAthleteSchema>
export type AthleteName = z.infer<typeof athleteNameSchema>
