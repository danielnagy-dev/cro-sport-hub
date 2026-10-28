import type { z } from 'zod'
import { athleteSchema } from './athlete.ts'
import { competitionSchema } from './competition.ts'
import { teamSchema } from './team.ts'

/** Id, name, and season from `competitionSchema`, for an editor's match form. */
export const competitionLookupSchema = competitionSchema.pick({
  id: true,
  name: true,
  season: true,
})

/** Id and name from `athleteSchema`. */
export const athleteLookupSchema = athleteSchema.pick({ id: true, name: true })

/** Id and name from `teamSchema`. v1 clubs are football only. */
export const teamLookupSchema = teamSchema.pick({ id: true, name: true })

export type CompetitionLookup = z.infer<typeof competitionLookupSchema>
export type AthleteLookup = z.infer<typeof athleteLookupSchema>
export type TeamLookup = z.infer<typeof teamLookupSchema>
