import { eq } from 'drizzle-orm'
import { CatalogError, type CatalogDb } from './errors.js'
import { matches } from './schema.js'

const SUBMIT_CONFLICT = 'Only a draft can be submitted'
const REJECT_CONFLICT = 'Only a match in review can be rejected'

async function move(
  db: CatalogDb,
  id: string,
  from: 'draft' | 'review',
  status: 'draft' | 'review',
  conflict: string,
  clearReviewer: boolean,
): Promise<void> {
  await db.transaction(async (tx) => {
    const database = tx as unknown as CatalogDb
    const rows = await database
      .select({ status: matches.status })
      .from(matches)
      .where(eq(matches.id, id))
    const row = rows[0]
    if (row === undefined) throw new CatalogError('unknown-ref', 'Unknown match')
    if (row.status !== from) throw new CatalogError('conflict', conflict)
    if (clearReviewer) {
      await database
        .update(matches)
        .set({ status, reviewedBy: null, publishedAt: null })
        .where(eq(matches.id, id))
      return
    }
    await database.update(matches).set({ status }).where(eq(matches.id, id))
  })
}

/** Draft becomes review. Does not record a reviewer or a publish time. */
export async function submitMatch(
  db: CatalogDb,
  id: string,
): Promise<{ id: string; status: 'review' }> {
  await move(db, id, 'draft', 'review', SUBMIT_CONFLICT, false)
  return { id, status: 'review' }
}

/** Review becomes draft. Clears any reviewer and publish time. */
export async function rejectMatch(
  db: CatalogDb,
  id: string,
): Promise<{ id: string; status: 'draft' }> {
  await move(db, id, 'review', 'draft', REJECT_CONFLICT, true)
  return { id, status: 'draft' }
}
