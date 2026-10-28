import { z } from 'zod'
import {
  countryCodeSchema,
  httpsUrlSchema,
  idSchema,
  isoDateSchema,
  slugSchema,
  textSchema,
} from './common.ts'

export const birthYearSchema = z.int().min(1940).max(2015)

export const athleteSchema = z.strictObject({
  id: idSchema,
  slug: slugSchema,
  name: textSchema(80),
  sportId: idSchema,
  country: countryCodeSchema,
  birthYear: birthYearSchema.optional(),
  position: textSchema(40).optional(),
  photoUrl: httpsUrlSchema.optional(),
})

export type Athlete = z.infer<typeof athleteSchema>

export const athleteTeamSchema = z
  .strictObject({
    athleteId: idSchema,
    teamId: idSchema,
    from: isoDateSchema,
    to: isoDateSchema.optional(),
  })
  .superRefine((period, ctx) => {
    if (period.to !== undefined && period.to < period.from) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'The club spell cannot end before it starts',
      })
    }
  })

export type AthleteTeam = z.infer<typeof athleteTeamSchema>
