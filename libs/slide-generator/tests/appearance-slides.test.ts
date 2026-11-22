import { expect, test } from 'vite-plus/test'
import {
  footballRendererReason,
  renderAppearancePngs,
  slidesFromAppearance,
  type AppearanceSlideInput,
  type AppearanceSlidePayload,
} from '../src/index.ts'
import { leagueAppearances } from './league-appearances.ts'

function payload(
  appearances: readonly AppearanceSlideInput[] = leagueAppearances,
): AppearanceSlidePayload {
  return { sportSlug: 'football', appearances }
}

test('slidesFromAppearance maps five seed appearances to two list documents', () => {
  const docs = slidesFromAppearance(payload())
  expect(docs.every((doc) => doc.sportSlug === 'football')).toBe(true)
  expect(docs.map((doc) => (doc.sportSlug === 'football' ? doc.kind : undefined))).toEqual([
    'list',
    'list',
  ])
  expect(docs[0]?.html).toContain('Brkić')
  expect(docs[0]?.html).toContain('GOLOVI</span>')
  expect(docs[0]?.html).not.toContain('Perić')
  expect(docs[1]?.html).toContain('Perić')
  expect(docs.every((doc) => doc.width === 1080 && doc.height === 1350)).toBe(true)
})

test('slidesFromAppearance returns no documents for an empty payload', () => {
  expect(slidesFromAppearance({ sportSlug: 'football', appearances: [] })).toEqual([])
})

test('slidesFromAppearance does not require a gallery entity', () => {
  const solo = leagueAppearances[0]
  if (solo === undefined) throw new Error('missing league appearance')
  const docs = slidesFromAppearance({ sportSlug: 'football', appearances: [solo] })
  expect(docs).toHaveLength(1)
  const doc = docs[0]
  expect(doc?.sportSlug).toBe('football')
  if (doc?.sportSlug === 'football') expect(doc.kind).toBe('player')
  expect(doc?.html).toContain('Brkić')
})

test('renderAppearancePngs returns no bytes and skips Chromium for an empty payload', async () => {
  await expect(renderAppearancePngs({ sportSlug: 'football', appearances: [] })).resolves.toEqual(
    [],
  )
})

test('renderAppearancePngs renders seed appearances as 1080×1350 PNGs', async ({ skip }) => {
  const reason = footballRendererReason()
  if (reason !== undefined) skip(reason)
  const pngs = await renderAppearancePngs(payload())
  expect(pngs).toHaveLength(2)
  for (const bytes of pngs) {
    expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    expect({ width: view.getUint32(16), height: view.getUint32(20) }).toEqual({
      width: 1080,
      height: 1350,
    })
  }
})
