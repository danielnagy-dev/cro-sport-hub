import { z } from 'zod'
import { countryCodeSchema, httpsUrlSchema, idSchema, slugSchema, textSchema } from './common.ts'

export const teamSchema = z.strictObject({
  id: idSchema,
  sportId: idSchema,
  slug: slugSchema,
  name: textSchema(80),
  shortName: textSchema(12),
  country: countryCodeSchema,
  crestUrl: httpsUrlSchema.optional(),
})

export type Team = z.infer<typeof teamSchema>
