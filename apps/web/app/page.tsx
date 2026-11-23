import type { Metadata } from 'next'
import { createApiClient } from '../lib/api-client'
import { parseIsoDay, todayIsoDay } from '../lib/day-list'
import type { PublicAppearance } from '../lib/public-editorial-schemas'
import { ResultsMain } from '../lib/results-view'
import { shareMetadata } from '../lib/site-metadata'

const RESULTS_API_ORIGIN = 'http://localhost:3001'

const HOME_PAGE_TITLE = 'Početna · Cro Sport Hub'
const HOME_PAGE_DESCRIPTION = 'Nastupi po danu.'

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

type HomeSearchParams = Promise<{ day?: string | string[] }>

export default async function HomePage({
  searchParams,
}: {
  searchParams?: HomeSearchParams
} = {}) {
  const params = searchParams === undefined ? {} : await searchParams
  const raw = params.day
  const day = parseIsoDay(Array.isArray(raw) ? raw[0] : raw, todayIsoDay())
  let items: readonly PublicAppearance[] | undefined
  try {
    items = await createApiClient({ baseUrl: RESULTS_API_ORIGIN }).dayAppearances(day)
  } catch {
    items = undefined
  }

  return <ResultsMain day={day} items={items} />
}
