import {
  appearanceStatusSchema,
  birthYearSchema,
  countryCodeSchema,
  idSchema,
  slugSchema,
  sportSlugSchema,
  textSchema,
  timestampSchema,
} from '@cro-sport-hub/shared-types'
import { z } from 'zod'

const refSchema = z.strictObject({ id: idSchema, slug: slugSchema, name: textSchema(80) })

export const publicAppearanceSchema = z.strictObject({
  id: idSchema,
  sportSlug: sportSlugSchema,
  competitionId: idSchema,
  athlete: refSchema.optional(),
  nationalTeam: refSchema.optional(),
  opponentLabel: textSchema(120),
  startsAt: timestampSchema,
  endsAt: timestampSchema.optional(),
  status: appearanceStatusSchema,
  result: z.record(z.string(), z.unknown()).optional(),
})
export type PublicAppearance = z.infer<typeof publicAppearanceSchema>
export const publicAppearanceListSchema = z.array(publicAppearanceSchema)

export const publicAthleteIndexSchema = z.array(
  z.strictObject({ slug: slugSchema, name: textSchema(80) }),
)
export type PublicAthleteIndexItem = z.infer<typeof publicAthleteIndexSchema>[number]

export const publicAthleteProfileSchema = z.strictObject({
  slug: slugSchema,
  name: textSchema(80),
  sport: sportSlugSchema,
  country: countryCodeSchema,
  birthYear: birthYearSchema.optional(),
  position: textSchema(40).optional(),
  clubName: textSchema(80).optional(),
  history: publicAppearanceListSchema,
  upcoming: publicAppearanceListSchema,
})
export type PublicAthleteProfile = z.infer<typeof publicAthleteProfileSchema>

export const nationalTeamScheduleSchema = z.strictObject({
  team: z.strictObject({
    id: idSchema,
    slug: slugSchema,
    name: textSchema(80),
    sportSlug: sportSlugSchema,
  }),
  past: publicAppearanceListSchema,
  current: publicAppearanceListSchema,
  upcoming: publicAppearanceListSchema,
})
export type NationalTeamSchedule = z.infer<typeof nationalTeamScheduleSchema>
