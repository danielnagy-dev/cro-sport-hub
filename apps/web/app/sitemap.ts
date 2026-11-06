import { createApiClient } from '../lib/api-client'
import { buildPublicSitemap } from '../lib/public-sitemap'
import { SITE_ORIGIN } from '../lib/site-metadata'

/** Local API origin. The sitemap calls it on the server only. */
const RESULTS_API_ORIGIN = 'http://localhost:3001'

/** Render on each request so athlete slugs stay current when the API is up. */
export const dynamic = 'force-dynamic'

export default async function sitemap() {
  const client = createApiClient({ baseUrl: RESULTS_API_ORIGIN })
  return buildPublicSitemap(client, SITE_ORIGIN)
}
