import { createApiClient } from '../lib/api-client'
import { buildPublicSitemap } from '../lib/public-sitemap'

/** Local API origin. The sitemap calls it on the server only. */
const RESULTS_API_ORIGIN = 'http://localhost:3001'

/** Public site origin for absolute sitemap URLs. */
const SITE_ORIGIN = 'http://localhost:3000'

/** Render on each request so athlete slugs stay current when the API is up. */
export const dynamic = 'force-dynamic'

export default async function sitemap() {
  const client = createApiClient({ baseUrl: RESULTS_API_ORIGIN })
  return buildPublicSitemap(client, SITE_ORIGIN)
}
