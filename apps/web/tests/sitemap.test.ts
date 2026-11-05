import type { AthleteName, SportSlug } from '@cro-sport-hub/shared-types'
import { expect, test } from 'vite-plus/test'
import { publicSitemapPaths, staticPublicPaths } from '../lib/public-sitemap'

const tennisAthletes: AthleteName[] = [{ slug: 'sample-player-a', name: 'Sample Player A' }]
const footballAthletes: AthleteName[] = [{ slug: 'karlo-brkic', name: 'Karlo Brkic' }]

function athletesBySportStub(
  lists: Partial<Record<SportSlug, AthleteName[] | 'reject'>>,
): (sport: SportSlug) => Promise<AthleteName[]> {
  return async (sport) => {
    const entry = lists[sport]
    if (entry === 'reject') throw new Error('fetch rejected')
    return entry ?? []
  }
}

test('lists home, sport pages, and athlete slugs from stubbed API lists', async () => {
  const paths = await publicSitemapPaths(
    athletesBySportStub({ tennis: tennisAthletes, football: footballAthletes }),
  )
  expect(paths).toEqual([
    ...staticPublicPaths,
    '/athletes/sample-player-a',
    '/athletes/karlo-brkic',
  ])
})

test('rejected athlete fetch keeps static paths only', async () => {
  const paths = await publicSitemapPaths(
    athletesBySportStub({ tennis: 'reject', football: 'reject' }),
  )
  expect(paths).toEqual([...staticPublicPaths])
})

test('omits studio and admin paths', async () => {
  const paths = await publicSitemapPaths(athletesBySportStub({}))
  for (const path of paths) {
    expect(path.startsWith('/studio')).toBe(false)
    expect(path.startsWith('/admin')).toBe(false)
  }
})
