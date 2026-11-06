import type { AthleteName, PublishedMatch } from '@cro-sport-hub/shared-types'
import type { Metadata } from 'next'
import { createApiClient } from '../../lib/api-client'
import { SportResultsMain } from '../../lib/results-view'
import { shareMetadata } from '../../lib/site-metadata'

/** Local API origin. The server calls it. The browser does not. */
const RESULTS_API_ORIGIN = 'http://localhost:3001'

const TENNIS_PAGE_TITLE = 'Tennis results · Cro Sport Hub'
const TENNIS_PAGE_DESCRIPTION = 'Latest tennis results.'

/** Render on each request so a down API is not baked into the build. */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: TENNIS_PAGE_TITLE,
  description: TENNIS_PAGE_DESCRIPTION,
  ...shareMetadata({
    pathname: '/tennis',
    title: TENNIS_PAGE_TITLE,
    description: TENNIS_PAGE_DESCRIPTION,
  }),
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
