import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { describe, expect, it } from 'vite-plus/test'
import { openCatalog } from '../../catalog/catalog.js'
import * as schema from '../../catalog/schema.js'
import {
  CLOCK_TIME_MESSAGE,
  DUPLICATE_CLOCK_MESSAGE,
  DUPLICATE_SORT_ORDER_MESSAGE,
  EMPTY_CLOCKS_MESSAGE,
  formatClockTime,
  listConnectedAccounts,
  listPublishSlotClocks,
  UNKNOWN_CLOCK_MESSAGE,
  updatePublishSlotClocks,
} from './settings.js'

const SEEDED = [
  { id: 'slot-clock-1530', label: '15:30', clockTime: '15:30', sortOrder: 1, active: true },
  { id: 'slot-clock-2200', label: '22:00', clockTime: '22:00', sortOrder: 2, active: true },
] as const

async function withDb<T>(work: (db: ReturnType<typeof drizzle<typeof schema>>) => Promise<T>) {
  const client = new PGlite()
  const db = drizzle(client, { schema })
  const catalog = await openCatalog(db)
  try {
    return await work(db)
  } finally {
    await catalog.close()
  }
}

describe('publish slot clocks', () => {
  it('lists seeded clocks and persists patch fields', async () => {
    await withDb(async (db) => {
      await expect(listPublishSlotClocks(db)).resolves.toEqual([...SEEDED])
      const updated = [
        {
          id: 'slot-clock-2200',
          label: 'Evening',
          clockTime: '21:45',
          sortOrder: 1,
          active: true,
        },
        {
          id: 'slot-clock-1530',
          label: 'Afternoon',
          clockTime: '16:00',
          sortOrder: 2,
          active: false,
        },
      ]
      await expect(updatePublishSlotClocks(db, { clocks: updated })).resolves.toEqual(updated)
      await expect(listPublishSlotClocks(db)).resolves.toEqual(updated)
    })
  })

  it('rejects empty lists, bad times, duplicates, and unknown ids', async () => {
    await withDb(async (db) => {
      const clock = SEEDED[0]
      await expect(updatePublishSlotClocks(db, { clocks: [] })).rejects.toMatchObject({
        code: 'invalid',
        issues: expect.arrayContaining([
          expect.objectContaining({ message: EMPTY_CLOCKS_MESSAGE }),
        ]),
      })
      await expect(
        updatePublishSlotClocks(db, { clocks: [{ ...clock, clockTime: '25:00' }] }),
      ).rejects.toMatchObject({
        issues: expect.arrayContaining([expect.objectContaining({ message: CLOCK_TIME_MESSAGE })]),
      })
      await expect(
        updatePublishSlotClocks(db, {
          clocks: [
            { ...clock, sortOrder: 1 },
            { ...clock, label: 'B', clockTime: '16:00', sortOrder: 2 },
          ],
        }),
      ).rejects.toMatchObject({ code: 'invalid', message: DUPLICATE_CLOCK_MESSAGE })
      await expect(
        updatePublishSlotClocks(db, {
          clocks: [
            { ...SEEDED[0], sortOrder: 1 },
            { ...SEEDED[1], sortOrder: 1 },
          ],
        }),
      ).rejects.toMatchObject({ code: 'invalid', message: DUPLICATE_SORT_ORDER_MESSAGE })
      await expect(
        updatePublishSlotClocks(db, {
          clocks: [{ ...clock, id: 'slot-clock-missing' }],
        }),
      ).rejects.toMatchObject({ code: 'unknown-ref', message: UNKNOWN_CLOCK_MESSAGE })
    })
  })
})

describe('listConnectedAccounts', () => {
  it('returns stable Instagram, Facebook, and X stubs', () => {
    expect(listConnectedAccounts()).toEqual([
      { network: 'instagram', loginChecked: false },
      { network: 'facebook', loginChecked: false },
      { network: 'x', loginChecked: false },
    ])
  })
})

describe('formatClockTime', () => {
  it('trims seconds from a Postgres time string', () => {
    expect(formatClockTime('15:30:00')).toBe('15:30')
    expect(formatClockTime('22:00')).toBe('22:00')
  })
})
