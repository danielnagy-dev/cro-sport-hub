import {
  creatorKindSchema,
  idSchema,
  isoDateSchema,
  networkPostStatusSchema,
  networkSchema,
  publishSlotStatusSchema,
  timestampSchema,
} from '@cro-sport-hub/shared-types'
import { and, asc, eq, gt, inArray, notInArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { CatalogError, parseRecord, type CatalogDb } from '../../catalog/errors.js'
import * as schema from '../../catalog/schema.js'

const { networkPosts, publishSlotClocks, publishSlots } = schema
const TERMINAL = ['published', 'skipped'] as const
const CLOCK_MSG = 'Expected a clock time as HH:mm'
const externalIdSchema = z.string().min(1).max(200).nullable()

function formatClockTime(value: string): string {
  const match = /^(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value)
  if (match?.[1] === undefined) throw new CatalogError('invalid', CLOCK_MSG)
  return match[1]
}

function asIsoOffset(value: string): string {
  const withT = value.includes('T') ? value : value.replace(' ', 'T')
  if (withT.endsWith('Z')) return withT.replace(/Z$/, '+00:00')
  return /[+-]\d{2}$/.test(withT) ? `${withT}:00` : withT
}

export const networkPostSchema = z.strictObject({
  id: idSchema,
  publishSlotId: idSchema,
  network: networkSchema,
  bodyText: z.string().max(4000),
  status: networkPostStatusSchema,
  externalPostId: externalIdSchema,
})
type Post = z.infer<typeof networkPostSchema>
export const publishSlotSchema = z.strictObject({
  id: idSchema,
  slotDate: isoDateSchema,
  slotClockId: idSchema,
  clockTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, CLOCK_MSG),
  status: publishSlotStatusSchema,
  slideOrder: z.array(idSchema),
  creatorKind: creatorKindSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  networkPosts: z.array(networkPostSchema),
})
export type PublishSlot = z.infer<typeof publishSlotSchema>
export const publishSlotDayQuerySchema = z.strictObject({ day: isoDateSchema })

export const patchPublishSlotBodySchema = z
  .strictObject({
    slideOrder: z.array(idSchema).optional(),
    networkPosts: z
      .array(
        z
          .strictObject({
            network: networkSchema,
            bodyText: z.string().max(4000).optional(),
            status: networkPostStatusSchema.optional(),
            externalPostId: externalIdSchema.optional(),
          })
          .refine(
            (v) =>
              v.bodyText !== undefined || v.status !== undefined || v.externalPostId !== undefined,
            { message: 'Expected a network post field to update' },
          ),
      )
      .min(1)
      .optional(),
  })
  .refine((v) => v.slideOrder !== undefined || v.networkPosts !== undefined, {
    message: 'Expected slideOrder and/or networkPosts',
  })

function toSlot(
  row: typeof publishSlots.$inferSelect,
  clockTime: string,
  posts: Post[],
): PublishSlot {
  return parseRecord(publishSlotSchema, {
    id: row.id,
    slotDate: row.slotDate,
    slotClockId: row.slotClockId,
    clockTime: formatClockTime(clockTime),
    status: row.status,
    slideOrder: parseRecord(z.array(idSchema), row.slideOrder),
    creatorKind: row.creatorKind,
    createdAt: asIsoOffset(row.createdAt),
    updatedAt: asIsoOffset(row.updatedAt),
    networkPosts: posts,
  })
}

async function postsFor(db: CatalogDb, slotIds: string[]): Promise<Map<string, Post[]>> {
  const map = new Map<string, Post[]>()
  if (slotIds.length === 0) return map
  for (const row of await db
    .select()
    .from(networkPosts)
    .where(inArray(networkPosts.publishSlotId, slotIds))
    .orderBy(asc(networkPosts.network), asc(networkPosts.id))) {
    const list = map.get(row.publishSlotId) ?? []
    list.push(
      parseRecord(networkPostSchema, {
        id: row.id,
        publishSlotId: row.publishSlotId,
        network: row.network,
        bodyText: row.bodyText,
        status: row.status,
        externalPostId: row.externalPostId,
      }),
    )
    map.set(row.publishSlotId, list)
  }
  return map
}

async function slotById(db: CatalogDb, id: string): Promise<PublishSlot> {
  const row = (
    await db
      .select({ slot: publishSlots, clockTime: publishSlotClocks.clockTime })
      .from(publishSlots)
      .innerJoin(publishSlotClocks, eq(publishSlots.slotClockId, publishSlotClocks.id))
      .where(eq(publishSlots.id, id))
  )[0]
  if (row === undefined) throw new CatalogError('unknown-ref', 'Unknown publish slot')
  return toSlot(row.slot, row.clockTime, (await postsFor(db, [id])).get(id) ?? [])
}

export async function listPublishSlotsForDay(
  db: CatalogDb,
  query: z.infer<typeof publishSlotDayQuerySchema>,
): Promise<PublishSlot[]> {
  const rows = await db
    .select({ slot: publishSlots, clockTime: publishSlotClocks.clockTime })
    .from(publishSlots)
    .innerJoin(publishSlotClocks, eq(publishSlots.slotClockId, publishSlotClocks.id))
    .where(eq(publishSlots.slotDate, query.day))
    .orderBy(asc(publishSlotClocks.sortOrder), asc(publishSlots.id))
  const posts = await postsFor(
    db,
    rows.map((r) => r.slot.id),
  )
  return rows.map((r) => toSlot(r.slot, r.clockTime, posts.get(r.slot.id) ?? []))
}

export async function getNextPublishSlot(
  db: CatalogDb,
  asOf?: { day: string; clockTime: string },
): Promise<PublishSlot | null> {
  if (asOf === undefined) {
    const iso = new Date().toISOString()
    asOf = { day: iso.slice(0, 10), clockTime: iso.slice(11, 16) }
  }
  const day = parseRecord(isoDateSchema, asOf.day)
  const clockTime = formatClockTime(asOf.clockTime)
  const upcoming = (
    await db
      .select({ slot: publishSlots, clockTime: publishSlotClocks.clockTime })
      .from(publishSlots)
      .innerJoin(publishSlotClocks, eq(publishSlots.slotClockId, publishSlotClocks.id))
      .where(
        and(
          notInArray(publishSlots.status, [...TERMINAL]),
          or(
            gt(publishSlots.slotDate, day),
            and(
              eq(publishSlots.slotDate, day),
              sql`substring(${publishSlotClocks.clockTime}::text from 1 for 5) >= ${clockTime}`,
            ),
          ),
        ),
      )
      .orderBy(asc(publishSlots.slotDate), asc(publishSlotClocks.sortOrder), asc(publishSlots.id))
      .limit(1)
  )[0]
  if (upcoming === undefined) return null
  const id = upcoming.slot.id
  return toSlot(upcoming.slot, upcoming.clockTime, (await postsFor(db, [id])).get(id) ?? [])
}

export async function patchPublishSlot(
  db: CatalogDb,
  id: string,
  value: unknown,
): Promise<PublishSlot> {
  const body = parseRecord(patchPublishSlotBodySchema, value)
  const exists = await db
    .select({ id: publishSlots.id })
    .from(publishSlots)
    .where(eq(publishSlots.id, id))
  if (exists[0] === undefined) throw new CatalogError('unknown-ref', 'Unknown publish slot')
  const now = asIsoOffset(new Date().toISOString())
  await db
    .update(publishSlots)
    .set({
      ...(body.slideOrder === undefined ? {} : { slideOrder: body.slideOrder }),
      updatedAt: now,
    })
    .where(eq(publishSlots.id, id))
  const seen = new Set<string>()
  for (const patch of body.networkPosts ?? []) {
    if (seen.has(patch.network)) throw new CatalogError('invalid', 'Network is listed twice')
    seen.add(patch.network)
    const current = (
      await db
        .select({ id: networkPosts.id })
        .from(networkPosts)
        .where(and(eq(networkPosts.publishSlotId, id), eq(networkPosts.network, patch.network)))
    )[0]
    if (current === undefined) {
      throw new CatalogError('unknown-ref', `Unknown network post for ${patch.network}`)
    }
    await db
      .update(networkPosts)
      .set({
        ...(patch.bodyText === undefined ? {} : { bodyText: patch.bodyText }),
        ...(patch.status === undefined ? {} : { status: patch.status }),
        ...(patch.externalPostId === undefined ? {} : { externalPostId: patch.externalPostId }),
        updatedAt: now,
      })
      .where(eq(networkPosts.id, current.id))
  }
  return slotById(db, id)
}

export async function approvePublishSlot(db: CatalogDb, id: string): Promise<PublishSlot> {
  const slot = (await db.select().from(publishSlots).where(eq(publishSlots.id, id)))[0]
  if (slot === undefined) throw new CatalogError('unknown-ref', 'Unknown publish slot')
  if ((TERMINAL as readonly string[]).includes(slot.status)) {
    throw new CatalogError('invalid', 'A published or skipped slot cannot be approved')
  }
  const now = asIsoOffset(new Date().toISOString())
  await db
    .update(publishSlots)
    .set({ status: 'approved', updatedAt: now })
    .where(eq(publishSlots.id, id))
  await db
    .update(networkPosts)
    .set({ status: 'approved', updatedAt: now })
    .where(
      and(
        eq(networkPosts.publishSlotId, id),
        inArray(networkPosts.status, ['planned', 'ready_for_review']),
      ),
    )
  return slotById(db, id)
}
