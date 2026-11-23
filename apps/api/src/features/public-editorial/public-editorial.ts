import {
  appearanceStatusSchema,
  birthYearSchema,
  countryCodeSchema,
  idSchema,
  isoDateSchema,
  slugSchema,
  sportSlugSchema,
  textSchema,
  timestampSchema,
} from '@cro-sport-hub/shared-types'
import { and, asc, eq, gte, inArray, lte, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { CatalogError, parseRecord, readParsed, type CatalogDb } from '../../catalog/errors.js'
import * as schema from '../../catalog/schema.js'

const { appearances, athletes, lineupEntries, nationalTeams } = schema
const participantAthlete = alias(athletes, 'participant_athlete')

export const unknownAthleteMessage = 'Unknown athlete'
export const unknownNationalTeamMessage = 'Unknown national team'
export const unknownSportMessage = 'Unknown sport'

const refSchema = z.strictObject({ id: idSchema, slug: slugSchema, name: textSchema(80) })

export const publicAppearanceSchema = z
  .strictObject({
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
  .superRefine((value, ctx) => {
    if ((value.athlete !== undefined) === (value.nationalTeam !== undefined)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Exactly one of athlete or nationalTeam is required',
        path: ['athlete'],
      })
    }
  })
export type PublicAppearance = z.infer<typeof publicAppearanceSchema>

export const publicAthleteIndexItemSchema = z.strictObject({
  slug: slugSchema,
  name: textSchema(80),
})
export const publicAthleteProfileSchema = z.strictObject({
  slug: slugSchema,
  name: textSchema(80),
  sport: sportSlugSchema,
  country: countryCodeSchema,
  birthYear: birthYearSchema.optional(),
  position: textSchema(40).optional(),
  clubName: textSchema(80).optional(),
  history: z.array(publicAppearanceSchema),
  upcoming: z.array(publicAppearanceSchema),
})
export const nationalTeamScheduleSchema = z.strictObject({
  team: z.strictObject({
    id: idSchema,
    slug: slugSchema,
    name: textSchema(80),
    sportSlug: sportSlugSchema,
  }),
  past: z.array(publicAppearanceSchema),
  current: z.array(publicAppearanceSchema),
  upcoming: z.array(publicAppearanceSchema),
})
export const dayAppearancesQuerySchema = z.strictObject({
  day: isoDateSchema,
  sportSlug: sportSlugSchema.optional(),
})

function asIsoOffset(value: string): string {
  const withT = value.includes('T') ? value : value.replace(' ', 'T')
  if (withT.endsWith('Z')) return withT.replace(/Z$/, '+00:00')
  return /[+-]\d{2}$/.test(withT) ? `${withT}:00` : withT
}

function bucket(rows: PublicAppearance[]) {
  const past: PublicAppearance[] = []
  const current: PublicAppearance[] = []
  const upcoming: PublicAppearance[] = []
  for (const row of rows) {
    if (row.status === 'completed' || row.status === 'cancelled') past.push(row)
    else if (row.status === 'in_progress') current.push(row)
    else if (row.status === 'scheduled') upcoming.push(row)
    else {
      const _exhaustive: never = row.status
      void _exhaustive
      throw new CatalogError('invalid', 'Unexpected appearance status')
    }
  }
  return { past, current, upcoming }
}

function toPublic(row: {
  appearance: typeof appearances.$inferSelect
  athleteId: string | null
  athleteSlug: string | null
  athleteName: string | null
  teamId: string | null
  teamSlug: string | null
  teamName: string | null
}): PublicAppearance {
  const a = row.appearance
  const base = {
    id: a.id,
    sportSlug: a.sportSlug,
    competitionId: a.competitionId,
    opponentLabel: a.opponentLabel,
    startsAt: asIsoOffset(a.startsAt),
    ...(a.endsAt === null ? {} : { endsAt: asIsoOffset(a.endsAt) }),
    status: a.status,
    ...(a.result == null ? {} : { result: a.result as Record<string, unknown> }),
  }
  if (row.athleteId && row.athleteSlug && row.athleteName) {
    return parseRecord(publicAppearanceSchema, {
      ...base,
      athlete: { id: row.athleteId, slug: row.athleteSlug, name: row.athleteName },
    })
  }
  if (row.teamId && row.teamSlug && row.teamName) {
    return parseRecord(publicAppearanceSchema, {
      ...base,
      nationalTeam: { id: row.teamId, slug: row.teamSlug, name: row.teamName },
    })
  }
  throw new CatalogError('invalid', 'Appearance needs an athlete or national team')
}

async function selectJoined(db: CatalogDb, filters: SQL[]): Promise<PublicAppearance[]> {
  const rows = await db
    .select({
      appearance: appearances,
      athleteId: participantAthlete.id,
      athleteSlug: participantAthlete.slug,
      athleteName: participantAthlete.name,
      teamId: nationalTeams.id,
      teamSlug: nationalTeams.slug,
      teamName: nationalTeams.name,
    })
    .from(appearances)
    .leftJoin(participantAthlete, eq(participantAthlete.id, appearances.athleteId))
    .leftJoin(nationalTeams, eq(nationalTeams.id, appearances.nationalTeamId))
    .where(and(...filters))
    .orderBy(asc(appearances.startsAt), asc(appearances.id))
  return rows.map(toPublic)
}

export async function listPublicDayAppearances(
  db: CatalogDb,
  query: z.infer<typeof dayAppearancesQuerySchema>,
): Promise<PublicAppearance[]> {
  return readParsed(async () => {
    const filters: SQL[] = [
      gte(appearances.startsAt, `${query.day}T00:00:00.000Z`),
      lte(appearances.startsAt, `${query.day}T23:59:59.999Z`),
    ]
    if (query.sportSlug !== undefined) filters.push(eq(appearances.sportSlug, query.sportSlug))
    return selectJoined(db, filters)
  })
}

export async function listPublicAthleteIndex(db: CatalogDb, sport: string) {
  return readParsed(async () => {
    const parsed = sportSlugSchema.safeParse(sport)
    if (!parsed.success) throw new CatalogError('unknown-ref', unknownSportMessage)
    const rows = await db
      .select({ slug: athletes.slug, name: athletes.name })
      .from(athletes)
      .where(eq(athletes.sportSlug, parsed.data))
      .orderBy(asc(athletes.name))
    return rows.map((row) => parseRecord(publicAthleteIndexItemSchema, row))
  })
}

export async function readPublicAthleteProfile(db: CatalogDb, slug: string) {
  return readParsed(async () => {
    const athlete = (await db.select().from(athletes).where(eq(athletes.slug, slug)))[0]
    if (athlete === undefined) throw new CatalogError('unknown-ref', unknownAthleteMessage)
    const [asParticipant, asLineup] = await Promise.all([
      db
        .select({ id: appearances.id })
        .from(appearances)
        .where(eq(appearances.athleteId, athlete.id)),
      db
        .select({ id: lineupEntries.appearanceId })
        .from(lineupEntries)
        .where(eq(lineupEntries.athleteId, athlete.id)),
    ])
    const ids = [...new Set([...asParticipant.map((r) => r.id), ...asLineup.map((r) => r.id)])]
    const listed = ids.length === 0 ? [] : await selectJoined(db, [inArray(appearances.id, ids)])
    const buckets = bucket(listed)
    return parseRecord(publicAthleteProfileSchema, {
      slug: athlete.slug,
      name: athlete.name,
      sport: athlete.sportSlug,
      country: athlete.country,
      ...(athlete.birthYear === null ? {} : { birthYear: athlete.birthYear }),
      ...(athlete.position === null ? {} : { position: athlete.position }),
      ...(athlete.clubName === null ? {} : { clubName: athlete.clubName }),
      history: [...buckets.past, ...buckets.current],
      upcoming: buckets.upcoming,
    })
  })
}

export async function readNationalTeamSchedule(db: CatalogDb, slug: string, sportSlug?: string) {
  return readParsed(async () => {
    const team = (await db.select().from(nationalTeams).where(eq(nationalTeams.slug, slug)))[0]
    if (team === undefined) throw new CatalogError('unknown-ref', unknownNationalTeamMessage)
    if (sportSlug !== undefined) {
      const sport = sportSlugSchema.safeParse(sportSlug)
      if (!sport.success) throw new CatalogError('unknown-ref', unknownSportMessage)
      if (team.sportSlug !== sport.data) {
        throw new CatalogError('unknown-ref', unknownNationalTeamMessage)
      }
    }
    const filters: SQL[] = [eq(appearances.nationalTeamId, team.id)]
    if (sportSlug !== undefined) filters.push(eq(appearances.sportSlug, sportSlug))
    return parseRecord(nationalTeamScheduleSchema, {
      team: { id: team.id, slug: team.slug, name: team.name, sportSlug: team.sportSlug },
      ...bucket(await selectJoined(db, filters)),
    })
  })
}
