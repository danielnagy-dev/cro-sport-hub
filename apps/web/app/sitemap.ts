import { createApiClient } from '../lib/api-client'
import { buildPublicSitemap } from '../lib/public-sitemap'
import { SITE_ORIGIN } from '../lib/site-metadata'

const RESULTS_API_ORIGIN = 'http://localhost:3001'

export const dynamic = 'force-dynamic'

export default async function sitemap() {
  const client = createApiClient({ baseUrl: RESULTS_API_ORIGIN })
  return buildPublicSitemap(client, SITE_ORIGIN)
}
