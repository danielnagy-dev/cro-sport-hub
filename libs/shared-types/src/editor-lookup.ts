import type { z } from 'zod'
import { athleteSchema } from './athlete.ts'
import { competitionSchema } from './competition.ts'
import { teamSchema } from './team.ts'

export const competitionLookupSchema = competitionSchema.pick({
  id: true,
  name: true,
  season: true,
})

export const athleteLookupSchema = athleteSchema.pick({ id: true, name: true })

export const teamLookupSchema = teamSchema.pick({ id: true, name: true })

export type CompetitionLookup = z.infer<typeof competitionLookupSchema>
export type AthleteLookup = z.infer<typeof athleteLookupSchema>
export type TeamLookup = z.infer<typeof teamLookupSchema>
