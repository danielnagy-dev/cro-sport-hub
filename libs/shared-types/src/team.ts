import { z } from 'zod'
import { countryCodeSchema, httpsUrlSchema, idSchema, slugSchema, textSchema } from './common.ts'

/**
 * Club lookup for the two sides of a football match and for club history
 * on an athlete. v1 has no team page and does not track national teams,
 * so this object has neither. `sportId` is only a reference: the
 * football-clubs-only rule needs the sport row, which this package does
 * not load.
 */
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
