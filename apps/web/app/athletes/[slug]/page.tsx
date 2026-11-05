import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ApiClientError, createApiClient } from '../../../lib/api-client'
import { AthleteProfileMain, AthleteUnavailableMain } from '../../../lib/athlete-view'

/** Local API origin. The server calls it. The browser does not. */
const PROFILE_API_ORIGIN = 'http://localhost:3001'

/** Render on each request so a down API is not baked into the build. */
export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

async function loadProfile(slug: string) {
  return createApiClient({ baseUrl: PROFILE_API_ORIGIN }).athlete(slug)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const profile = await loadProfile(slug)
    return { title: `${profile.name} · Cro Sport Hub` }
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return {}
    return { title: 'Athlete · Cro Sport Hub' }
  }
}

export default async function AthletePage({ params }: PageProps) {
  const { slug } = await params
  try {
    return <AthleteProfileMain profile={await loadProfile(slug)} />
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound()
    return <AthleteUnavailableMain />
  }
}
