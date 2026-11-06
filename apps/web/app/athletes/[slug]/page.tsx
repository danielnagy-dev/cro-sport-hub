import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ApiClientError, createApiClient } from '../../../lib/api-client'
import { AthleteProfileMain, AthleteUnavailableMain } from '../../../lib/athlete-view'
import { shareMetadata } from '../../../lib/site-metadata'

/** Local API origin. The server calls it. The browser does not. */
const PROFILE_API_ORIGIN = 'http://localhost:3001'

const ATHLETE_FALLBACK_TITLE = 'Athlete · Cro Sport Hub'
const ATHLETE_FALLBACK_DESCRIPTION = 'Public athlete profile on Cro Sport Hub.'

/** Render on each request so a down API is not baked into the build. */
export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

async function loadProfile(slug: string) {
  return createApiClient({ baseUrl: PROFILE_API_ORIGIN }).athlete(slug)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pathname = `/athletes/${slug}`
  try {
    const profile = await loadProfile(slug)
    const title = `${profile.name} · Cro Sport Hub`
    const description = `Published results and profile for ${profile.name}.`
    return {
      title,
      description,
      ...shareMetadata({ pathname, title, description }),
    }
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return {}
    return {
      title: ATHLETE_FALLBACK_TITLE,
      description: ATHLETE_FALLBACK_DESCRIPTION,
      ...shareMetadata({
        pathname,
        title: ATHLETE_FALLBACK_TITLE,
        description: ATHLETE_FALLBACK_DESCRIPTION,
      }),
    }
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
