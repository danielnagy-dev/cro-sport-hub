import type { AthleteName, PublishedMatch } from '@cro-sport-hub/shared-types'
import type { Metadata } from 'next'
import { createApiClient } from '../../lib/api-client'
import { SportResultsMain } from '../../lib/results-view'

/** Local API origin. The server calls it. The browser does not. */
const RESULTS_API_ORIGIN = 'http://localhost:3001'

/** Render on each request so a down API is not baked into the build. */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tennis results · Cro Sport Hub',
  description: 'Latest tennis results.',
}

export default async function TennisPage() {
  const client = createApiClient({ baseUrl: RESULTS_API_ORIGIN })
  let items: readonly PublishedMatch[] | undefined
  let athletes: readonly AthleteName[] | undefined
  try {
    items = (await client.matchesTennis()).items
  } catch {
    items = undefined
  }
  try {
    athletes = await client.athletesBySport('tennis')
  } catch {
    athletes = undefined
  }

  return <SportResultsMain items={items} athletes={athletes} />
}
