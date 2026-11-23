import type { Metadata } from 'next'
import { createApiClient } from '../../lib/api-client'
import { t } from '../../lib/messages'
import type { PublicAthleteIndexItem } from '../../lib/public-editorial-schemas'
import { shareMetadata } from '../../lib/site-metadata'
import { parseSportSlug, SportasiMain } from '../../lib/sportasi-view'

const RESULTS_API_ORIGIN = 'http://localhost:3001'

const TITLE = `${t('sportasi.title')} · ${t('chrome.brand')}`
const DESCRIPTION = t('sportasi.lead')

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...shareMetadata({
    pathname: '/sportasi',
    title: TITLE,
    description: DESCRIPTION,
  }),
}

type SportasiSearchParams = Promise<{ sport?: string | string[] }>

export default async function SportasiPage({
  searchParams,
}: {
  searchParams?: SportasiSearchParams
} = {}) {
  const params = searchParams === undefined ? {} : await searchParams
  const sport = parseSportSlug(params.sport)
  let athletes: readonly PublicAthleteIndexItem[] | undefined
  try {
    athletes = await createApiClient({ baseUrl: RESULTS_API_ORIGIN }).publicAthletes(sport)
  } catch {
    athletes = undefined
  }

  return <SportasiMain sport={sport} athletes={athletes} />
}
