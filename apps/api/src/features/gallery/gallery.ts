import { randomUUID } from 'node:crypto'
import { zipSync } from 'fflate'
import {
  catalogSlides,
  footballRendererReason,
  footballSlides,
  renderFootballPngs,
  type FootballSlide,
} from '@cro-sport-hub/slide-generator'
import {
  galleryCreatedSchema,
  galleryRenderResponseSchema,
  galleryViewSchema,
  statusSchema,
} from '@cro-sport-hub/shared-types'
import { and, asc, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { catalogDb, type Catalog } from '../../catalog/catalog.js'
import { CatalogError, parseRecord, type CatalogDb } from '../../catalog/errors.js'
import * as schema from '../../catalog/schema.js'

const {
  appearances,
  athletes,
  competitions,
  footballMatches,
  galleries,
  gallerySlides,
  matches,
  teams,
} = schema

export const pickPublishedFootballMessage = 'Pick a published football match'
export const onlyPublishedFootballMessage = 'Only a published football match can be added'
export const matchListedTwiceMessage = 'Match is listed twice'

const storedSlideSchema = z.custom<FootballSlide>((value) => {
  if (typeof value !== 'object' || value === null) return false
  const kind = (value as { kind?: unknown }).kind
  return kind === 'player' || kind === 'list'
})

type TaggedEntry = { matchId: string; entry: ReturnType<typeof catalogSlides>[number] }

async function loadMatchAppearances(db: CatalogDb, matchId: string) {
  const homeSide = alias(teams, 'home_side')
  const awaySide = alias(teams, 'away_side')
  const rows = await db
    .select({
      athleteName: athletes.name,
      athletePosition: athletes.position,
      clubName: teams.name,
      competition: competitions.name,
      round: matches.round,
      date: matches.date,
      homeTeamId: footballMatches.homeTeamId,
      homeTeam: homeSide.name,
      awayTeam: awaySide.name,
      homeGoals: footballMatches.homeGoals,
      awayGoals: footballMatches.awayGoals,
      teamId: appearances.teamId,
      started: appearances.started,
      minutes: appearances.minutes,
      goals: appearances.goals,
      assists: appearances.assists,
      yellowCards: appearances.yellowCards,
      redCard: appearances.redCard,
      athleteId: appearances.athleteId,
    })
    .from(appearances)
    .innerJoin(matches, eq(matches.id, appearances.matchId))
    .innerJoin(competitions, eq(competitions.id, matches.competitionId))
    .innerJoin(footballMatches, eq(footballMatches.matchId, matches.id))
    .innerJoin(athletes, eq(athletes.id, appearances.athleteId))
    .innerJoin(teams, eq(teams.id, appearances.teamId))
    .innerJoin(homeSide, eq(homeSide.id, footballMatches.homeTeamId))
    .innerJoin(awaySide, eq(awaySide.id, footballMatches.awayTeamId))
    .where(eq(appearances.matchId, matchId))
  return rows
    .sort(
      (left, right) =>
        right.goals - left.goals ||
        right.assists - left.assists ||
        right.minutes - left.minutes ||
        left.athleteId.localeCompare(right.athleteId, 'en'),
    )
    .map((row) => ({
      athleteName: row.athleteName,
      clubName: row.clubName,
      competition: row.competition,
      round: row.round,
      date: row.date,
      homeTeam: row.homeTeam,
      awayTeam: row.awayTeam,
      homeGoals: row.homeGoals,
      awayGoals: row.awayGoals,
      side: row.teamId === row.homeTeamId ? ('home' as const) : ('away' as const),
      started: row.started,
      minutes: row.minutes,
      goals: row.goals,
      assists: row.assists,
      yellowCards: row.yellowCards,
      redCard: row.redCard,
      ...(row.athletePosition ? { athletePosition: row.athletePosition } : {}),
    }))
}

function slideMatchId(slide: FootballSlide, tagged: readonly TaggedEntry[]): string {
  const name = slide.kind === 'player' ? slide.player.name : slide.players[0]?.name
  return (
    tagged.find((entry) => entry.entry.player.name === name)?.matchId ??
    tagged[0]?.matchId ??
    'missing'
  )
}
async function assertPublishedFootball(db: CatalogDb, matchId: string): Promise<void> {
  const row = (
    await db
      .select({ status: matches.status, sportSlug: matches.sportSlug })
      .from(matches)
      .where(eq(matches.id, matchId))
  )[0]
  if (row === undefined || row.sportSlug !== 'football' || row.status !== 'published') {
    throw new CatalogError('invalid', onlyPublishedFootballMessage)
  }
}

export async function createGallery(
  catalog: Catalog,
  matchIds: readonly string[],
  actorId: string,
) {
  if (matchIds.length === 0) throw new CatalogError('invalid', pickPublishedFootballMessage)
  const seen = new Set<string>()
  for (const matchId of matchIds) {
    if (seen.has(matchId)) throw new CatalogError('invalid', matchListedTwiceMessage)
    seen.add(matchId)
  }
  const db = catalogDb(catalog)
  for (const matchId of matchIds) await assertPublishedFootball(db, matchId)
  const tagged: TaggedEntry[] = []
  for (const matchId of matchIds) {
    for (const entry of catalogSlides(await loadMatchAppearances(db, matchId)))
      tagged.push({ matchId, entry })
  }
  const slides = footballSlides(tagged.map((row) => row.entry)).map((slide) => ({
    slide,
    matchId: slideMatchId(slide, tagged),
  }))
  const galleryId = `gallery-${randomUUID()}`
  const createdAt = new Date().toISOString()
  await db.transaction(async (tx) => {
    const database = tx as unknown as CatalogDb
    await database.insert(galleries).values({
      id: galleryId,
      status: 'draft',
      createdBy: actorId,
      reviewedBy: null,
      publishedAt: null,
      createdAt,
    })
    if (slides.length > 0) {
      await database.insert(gallerySlides).values(
        slides.map((row, slideIndex) => ({
          galleryId,
          slideIndex,
          matchId: row.matchId,
          caption: null,
          payload: row.slide,
        })),
      )
    }
  })
  return parseRecord(galleryCreatedSchema, {
    id: galleryId,
    slideIndexes: slides.map((_, index) => index),
  })
}

export async function readGallery(
  db: CatalogDb,
  id: string,
): Promise<z.infer<typeof galleryViewSchema>> {
  const header = await db.select().from(galleries).where(eq(galleries.id, id))
  if (header[0] === undefined) throw new CatalogError('unknown-ref', 'Unknown gallery')
  const slides = await db
    .select()
    .from(gallerySlides)
    .where(eq(gallerySlides.galleryId, id))
    .orderBy(asc(gallerySlides.slideIndex))
  return parseRecord(galleryViewSchema, {
    id: header[0].id,
    status: statusSchema.parse(header[0].status),
    slides: slides.map((slide) => {
      const parsed = storedSlideSchema.parse(slide.payload)
      const players = parsed.kind === 'player' ? [parsed.player] : [...parsed.players]
      return {
        index: slide.slideIndex,
        matchId: slide.matchId,
        caption: slide.caption ?? '',
        stats: players.map((player) => ({
          name: player.name,
          stats: player.stats.map((stat) => ({ label: stat.label, value: stat.value ?? '' })),
        })),
      }
    }),
  })
}

export async function patchGallerySlideCaption(
  db: CatalogDb,
  galleryId: string,
  slideIndex: number,
  caption: string,
) {
  if (
    (
      await db.select({ id: galleries.id }).from(galleries).where(eq(galleries.id, galleryId))
    )[0] === undefined
  ) {
    throw new CatalogError('unknown-ref', 'Unknown gallery')
  }
  const updated = await db
    .update(gallerySlides)
    .set({ caption: caption.length === 0 ? null : caption })
    .where(and(eq(gallerySlides.galleryId, galleryId), eq(gallerySlides.slideIndex, slideIndex)))
    .returning({ slideIndex: gallerySlides.slideIndex })
  if (updated.length === 0) throw new CatalogError('unknown-ref', 'Unknown slide')
}

function slideForRender(payload: unknown, caption: string | null): FootballSlide {
  const parsed = storedSlideSchema.parse(payload)
  if (caption === null || caption.length === 0) return parsed
  return { ...parsed, caption }
}

export async function renderGalleryPngs(
  db: CatalogDb,
  galleryId: string,
  render: (slides: readonly FootballSlide[]) => Promise<Uint8Array[]> = renderFootballPngs,
) {
  if (
    (
      await db.select({ id: galleries.id }).from(galleries).where(eq(galleries.id, galleryId))
    )[0] === undefined
  ) {
    throw new CatalogError('unknown-ref', 'Unknown gallery')
  }
  const reason = footballRendererReason()
  if (reason !== undefined) throw new CatalogError('invalid', reason)
  const rows = await db
    .select()
    .from(gallerySlides)
    .where(eq(gallerySlides.galleryId, galleryId))
    .orderBy(asc(gallerySlides.slideIndex))
  const slides = rows.map((row) => slideForRender(row.payload, row.caption))
  const pngs = await render(slides)
  if (pngs.length !== slides.length) {
    throw new Error('The renderer returned the wrong number of PNGs')
  }
  await db.transaction(async (tx) => {
    const database = tx as unknown as CatalogDb
    for (let index = 0; index < rows.length; index += 1) {
      await database
        .update(gallerySlides)
        .set({ png: Buffer.from(pngs[index]) })
        .where(
          and(
            eq(gallerySlides.galleryId, galleryId),
            eq(gallerySlides.slideIndex, rows[index].slideIndex),
          ),
        )
    }
  })
  return parseRecord(galleryRenderResponseSchema, { slideCount: slides.length })
}

export const ONLY_APPROVED_DOWNLOAD_MESSAGE = 'Only an approved gallery can be downloaded'
export const GALLERY_SLIDES_NOT_RENDERED_MESSAGE = 'Gallery slides are not rendered'

const ZIP_ENTRY_WIDTH = 2

function zipEntryName(position: number): string {
  return `${String(position + 1).padStart(ZIP_ENTRY_WIDTH, '0')}.png`
}

const submitConflict = 'Only a draft gallery can be submitted'
const rejectConflict = 'Only a gallery in review can be rejected'
const publishConflict = 'Only a gallery in review can be published'

function isoTimestampWithOffset(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absolute = Math.abs(offsetMinutes)
  const hours = pad(Math.floor(absolute / 60))
  const minutes = pad(absolute % 60)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${hours}:${minutes}`
}

async function moveGallery(
  db: CatalogDb,
  id: string,
  from: 'draft' | 'review',
  status: 'draft' | 'review' | 'published',
  conflict: string,
  patch: { reviewedBy: string | null; publishedAt: string | null },
): Promise<void> {
  await db.transaction(async (tx) => {
    const database = tx as unknown as CatalogDb
    const row = (
      await database
        .select({ status: galleries.status })
        .from(galleries)
        .where(eq(galleries.id, id))
    )[0]
    if (row === undefined) throw new CatalogError('unknown-ref', 'Unknown gallery')
    if (row.status !== from) throw new CatalogError('conflict', conflict)
    await database
      .update(galleries)
      .set({ status, reviewedBy: patch.reviewedBy, publishedAt: patch.publishedAt })
      .where(eq(galleries.id, id))
  })
}

/** Draft becomes review. Does not record a reviewer or a publish time. */
export async function submitGallery(
  db: CatalogDb,
  id: string,
): Promise<{ id: string; status: 'review' }> {
  await moveGallery(db, id, 'draft', 'review', submitConflict, {
    reviewedBy: null,
    publishedAt: null,
  })
  return { id, status: 'review' }
}

/** Review becomes draft. Clears any reviewer and publish time. */
export async function rejectGallery(
  db: CatalogDb,
  id: string,
): Promise<{ id: string; status: 'draft' }> {
  await moveGallery(db, id, 'review', 'draft', rejectConflict, {
    reviewedBy: null,
    publishedAt: null,
  })
  return { id, status: 'draft' }
}

/** Review becomes published. Records the reviewer and an ISO time with a numeric offset. */
export async function publishGallery(
  db: CatalogDb,
  id: string,
  reviewerId: string,
): Promise<{ id: string; status: 'published' }> {
  await moveGallery(db, id, 'review', 'published', publishConflict, {
    reviewedBy: reviewerId,
    publishedAt: isoTimestampWithOffset(),
  })
  return { id, status: 'published' }
}

export async function downloadGalleryZip(db: CatalogDb, galleryId: string): Promise<Buffer> {
  const header = (
    await db.select({ status: galleries.status }).from(galleries).where(eq(galleries.id, galleryId))
  )[0]
  if (header === undefined) throw new CatalogError('unknown-ref', 'Unknown gallery')
  if (header.status !== 'published') {
    throw new CatalogError('conflict', ONLY_APPROVED_DOWNLOAD_MESSAGE)
  }
  const rows = await db
    .select({ png: gallerySlides.png })
    .from(gallerySlides)
    .where(eq(gallerySlides.galleryId, galleryId))
    .orderBy(asc(gallerySlides.slideIndex))
  for (const row of rows) {
    if (row.png === null || row.png.length === 0) {
      throw new CatalogError('conflict', GALLERY_SLIDES_NOT_RENDERED_MESSAGE)
    }
  }
  const files: Record<string, Uint8Array> = {}
  rows.forEach((row, position) => {
    files[zipEntryName(position)] = new Uint8Array(row.png as Buffer)
  })
  return Buffer.from(zipSync(files))
}

export async function readGallerySlidePng(
  db: CatalogDb,
  galleryId: string,
  slideIndex: number,
): Promise<Buffer> {
  if (
    (
      await db.select({ id: galleries.id }).from(galleries).where(eq(galleries.id, galleryId))
    )[0] === undefined
  ) {
    throw new CatalogError('unknown-ref', 'Unknown gallery')
  }
  const row = (
    await db
      .select({ png: gallerySlides.png })
      .from(gallerySlides)
      .where(and(eq(gallerySlides.galleryId, galleryId), eq(gallerySlides.slideIndex, slideIndex)))
  )[0]
  if (row === undefined) throw new CatalogError('unknown-ref', 'Unknown slide')
  if (row.png === null || row.png.length === 0) {
    throw new CatalogError('unknown-ref', 'Slide is not rendered')
  }
  return row.png
}
