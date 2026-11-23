import {
  slidesFromAppearance,
  type AppearanceSlideInput,
  type AppearanceSportSlug,
} from '@cro-sport-hub/slide-generator'
import { idSchema } from '@cro-sport-hub/shared-types'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { CatalogError, parseRecord, type CatalogDb } from '../../catalog/errors.js'
import * as schema from '../../catalog/schema.js'

const { appearances, athletes, competitions, nationalTeams, publishSlots } = schema
const UNKNOWN_SLOT = 'Unknown publish slot'
const UNKNOWN_APPEARANCE = 'Unknown appearance'
const SPORT = z.enum(['football', 'tennis', 'basketball'])

export const slidePreviewItemSchema = z.strictObject({
  appearanceId: idSchema,
  sportSlug: SPORT,
  html: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})
export type SlidePreviewItem = z.infer<typeof slidePreviewItemSchema>
export const slidePreviewsResponseSchema = z.strictObject({
  publishSlotId: idSchema,
  slides: z.array(slidePreviewItemSchema),
})
export type SlidePreviewsResponse = z.infer<typeof slidePreviewsResponseSchema>

function dayOf(startsAt: string): string {
  return (startsAt.includes('T') ? startsAt : startsAt.replace(' ', 'T')).slice(0, 10)
}

function scoreOf(result: Record<string, unknown> | null) {
  const raw = result?.['score'] ?? result?.['sets']
  if (typeof raw !== 'string') return { home: 0, away: 0 }
  const match = /^(\d+)\s*[-:]\s*(\d+)$/.exec(raw.trim())
  return match?.[1] && match[2]
    ? { home: Number(match[1]), away: Number(match[2]) }
    : { home: 0, away: 0 }
}

function toInput(
  athleteName: string,
  clubName: string,
  competition: string,
  date: string,
  awayTeam: string,
  homeGoals: number,
  awayGoals: number,
  athletePosition?: string | null,
): AppearanceSlideInput {
  return {
    athleteName,
    clubName,
    competition,
    round: '—',
    date,
    homeTeam: clubName,
    awayTeam,
    homeGoals,
    awayGoals,
    side: 'home',
    started: true,
    minutes: 90,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCard: false,
    ...(athletePosition ? { athletePosition } : {}),
  }
}

async function payloadFor(
  db: CatalogDb,
  appearanceId: string,
): Promise<{ sportSlug: AppearanceSportSlug; appearances: AppearanceSlideInput[] }> {
  const found = (
    await db
      .select({
        appearance: appearances,
        competitionName: competitions.name,
        athleteName: athletes.name,
        athletePosition: athletes.position,
        athleteClubName: athletes.clubName,
        nationalTeamName: nationalTeams.name,
      })
      .from(appearances)
      .innerJoin(competitions, eq(competitions.id, appearances.competitionId))
      .leftJoin(athletes, eq(athletes.id, appearances.athleteId))
      .leftJoin(nationalTeams, eq(nationalTeams.id, appearances.nationalTeamId))
      .where(eq(appearances.id, appearanceId))
  )[0]
  if (found === undefined) throw new CatalogError('unknown-ref', UNKNOWN_APPEARANCE)
  const sportSlug = SPORT.parse(found.appearance.sportSlug)
  const result =
    found.appearance.result === null ? null : (found.appearance.result as Record<string, unknown>)
  const score = scoreOf(result)
  const club =
    (typeof result?.['club'] === 'string' && result['club']) ||
    found.athleteClubName ||
    found.athleteName ||
    found.nationalTeamName ||
    'Club'
  const name = found.athleteName ?? found.nationalTeamName
  if (name === null) {
    throw new CatalogError('invalid', 'Appearance needs an athlete or national team')
  }
  return {
    sportSlug,
    appearances: [
      toInput(
        name,
        club,
        found.competitionName,
        dayOf(found.appearance.startsAt),
        found.appearance.opponentLabel,
        score.home,
        score.away,
        found.athletePosition,
      ),
    ],
  }
}

export async function previewPublishSlotSlides(
  db: CatalogDb,
  publishSlotId: string,
): Promise<SlidePreviewsResponse> {
  const slot = (
    await db
      .select({ id: publishSlots.id, slideOrder: publishSlots.slideOrder })
      .from(publishSlots)
      .where(eq(publishSlots.id, publishSlotId))
  )[0]
  if (slot === undefined) throw new CatalogError('unknown-ref', UNKNOWN_SLOT)
  const order = parseRecord(z.array(idSchema), slot.slideOrder)
  if (order.length === 0) {
    return parseRecord(slidePreviewsResponseSchema, { publishSlotId: slot.id, slides: [] })
  }
  const known = new Set(
    (
      await db
        .select({ id: appearances.id })
        .from(appearances)
        .where(inArray(appearances.id, order))
    ).map((r) => r.id),
  )
  for (const id of order) {
    if (!known.has(id)) throw new CatalogError('unknown-ref', UNKNOWN_APPEARANCE)
  }
  const slides: SlidePreviewItem[] = []
  for (const appearanceId of order) {
    const payload = await payloadFor(db, appearanceId)
    const doc = slidesFromAppearance(payload, { hero: 'off' })[0]
    if (doc === undefined) throw new CatalogError('invalid', 'Appearance produced no slide preview')
    slides.push(
      parseRecord(slidePreviewItemSchema, {
        appearanceId,
        sportSlug: payload.sportSlug,
        html: doc.html,
        width: doc.width,
        height: doc.height,
      }),
    )
  }
  return parseRecord(slidePreviewsResponseSchema, { publishSlotId: slot.id, slides })
}
