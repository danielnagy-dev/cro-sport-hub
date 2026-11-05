import type { PublishedMatch } from '@cro-sport-hub/shared-types'
import type { Metadata } from 'next'
import { createApiClient } from '../../lib/api-client'
import { ResultsMain } from '../../lib/results-view'

/** Local API origin. The server calls it. The browser does not. */
const resultsApiOrigin = 'http://localhost:3001'

/** Render on each request so a down API is not baked into the build. */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Football results · Cro Sport Hub',
  description: 'Latest football results.',
}

export default async function FootballPage() {
  let items: readonly PublishedMatch[] | undefined
  try {
    items = (await createApiClient({ baseUrl: resultsApiOrigin }).matchesFootball()).items
  } catch {
    items = undefined
  }

  return <ResultsMain items={items} />
}
