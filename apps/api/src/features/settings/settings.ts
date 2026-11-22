import { idSchema, networkSchema, textSchema } from '@cro-sport-hub/shared-types'
import { asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { CatalogError, parseRecord, type CatalogDb } from '../../catalog/errors.js'
import { publishSlotClocks } from '../../catalog/schema.js'

/** Wall-clock time for a publish slot, hours and minutes only. */
export const CLOCK_TIME_MESSAGE = 'Expected a clock time as HH:mm'
export const EMPTY_CLOCKS_MESSAGE = 'Expected at least one publish slot clock'
export const UNKNOWN_CLOCK_MESSAGE = 'Unknown publish slot clock'
export const DUPLICATE_CLOCK_MESSAGE = 'Publish slot clock is listed twice'
export const DUPLICATE_SORT_ORDER_MESSAGE = 'Publish slot clock sort order is listed twice'

export const clockTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, CLOCK_TIME_MESSAGE)

export const publishSlotClockSchema = z.strictObject({
  id: idSchema,
  label: textSchema(40),
  clockTime: clockTimeSchema,
  sortOrder: z.int().min(0).max(1000),
  active: z.boolean(),
})

export type PublishSlotClock = z.infer<typeof publishSlotClockSchema>

export const updatePublishSlotClocksBodySchema = z.strictObject({
  clocks: z.array(publishSlotClockSchema).min(1, EMPTY_CLOCKS_MESSAGE),
})

export type UpdatePublishSlotClocksBody = z.infer<typeof updatePublishSlotClocksBodySchema>

export const connectedAccountSchema = z.strictObject({
  network: networkSchema,
  loginChecked: z.boolean(),
})

export type ConnectedAccount = z.infer<typeof connectedAccountSchema>

const CONNECTED_ACCOUNT_STUBS = [
  { network: 'instagram', loginChecked: false },
  { network: 'facebook', loginChecked: false },
  { network: 'x', loginChecked: false },
] as const satisfies readonly ConnectedAccount[]

/** Normalize PG `time` (`HH:mm:ss`) or API `HH:mm` to the public `HH:mm` shape. */
export function formatClockTime(value: string): string {
  const match = /^(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value)
  if (match?.[1] === undefined) {
    throw new CatalogError('invalid', CLOCK_TIME_MESSAGE)
  }
  return match[1]
}

function toStoredClock(row: typeof publishSlotClocks.$inferSelect): PublishSlotClock {
  return parseRecord(publishSlotClockSchema, {
    id: row.id,
    label: row.label,
    clockTime: formatClockTime(row.clockTime),
    sortOrder: row.sortOrder,
    active: row.active,
  })
}

export async function listPublishSlotClocks(db: CatalogDb): Promise<PublishSlotClock[]> {
  const rows = await db
    .select()
    .from(publishSlotClocks)
    .orderBy(asc(publishSlotClocks.sortOrder), asc(publishSlotClocks.id))
  return rows.map(toStoredClock)
}

export async function updatePublishSlotClocks(
  db: CatalogDb,
  value: unknown,
): Promise<PublishSlotClock[]> {
  const body = parseRecord(updatePublishSlotClocksBodySchema, value)
  const seenIds = new Set<string>()
  const seenOrders = new Set<number>()
  for (const clock of body.clocks) {
    if (seenIds.has(clock.id)) throw new CatalogError('invalid', DUPLICATE_CLOCK_MESSAGE)
    if (seenOrders.has(clock.sortOrder)) {
      throw new CatalogError('invalid', DUPLICATE_SORT_ORDER_MESSAGE)
    }
    seenIds.add(clock.id)
    seenOrders.add(clock.sortOrder)
  }

  const ids = body.clocks.map((clock) => clock.id)
  const existing = await db
    .select({ id: publishSlotClocks.id })
    .from(publishSlotClocks)
    .where(inArray(publishSlotClocks.id, ids))
  if (existing.length !== ids.length) {
    throw new CatalogError('unknown-ref', UNKNOWN_CLOCK_MESSAGE)
  }

  for (const clock of body.clocks) {
    await db
      .update(publishSlotClocks)
      .set({
        label: clock.label,
        clockTime: clock.clockTime,
        sortOrder: clock.sortOrder,
        active: clock.active,
      })
      .where(eq(publishSlotClocks.id, clock.id))
  }

  return listPublishSlotClocks(db)
}

/** Stable placeholder rows. No network calls; login check lands later. */
export function listConnectedAccounts(): ConnectedAccount[] {
  return CONNECTED_ACCOUNT_STUBS.map((row) => parseRecord(connectedAccountSchema, row))
}
