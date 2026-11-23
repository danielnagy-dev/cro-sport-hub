import type { PublishedMatch } from '@cro-sport-hub/shared-types'
import type { Metadata } from 'next'
import { createApiClient } from '../lib/api-client'
import { ResultsMain } from '../lib/results-view'
import { shareMetadata } from '../lib/site-metadata'

const RESULTS_API_ORIGIN = 'http://localhost:3001'

const HOME_PAGE_TITLE = 'Tennis and football results · Cro Sport Hub'
const HOME_PAGE_DESCRIPTION = 'Latest tennis and football results.'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: HOME_PAGE_TITLE,
  description: HOME_PAGE_DESCRIPTION,
  ...shareMetadata({
    pathname: '/',
    title: HOME_PAGE_TITLE,
    description: HOME_PAGE_DESCRIPTION,
  }),
}

export default async function HomePage() {
  let items: readonly PublishedMatch[] | undefined
  try {
    items = (await createApiClient({ baseUrl: RESULTS_API_ORIGIN }).matches()).items
  } catch {
    items = undefined
  }

  return <ResultsMain items={items} />
}
