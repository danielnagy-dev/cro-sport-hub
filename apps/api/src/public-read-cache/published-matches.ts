import { publishedMatchPageSchema, type PublishedMatchPage } from '@cro-sport-hub/shared-types'
import { type PublicReadCacheClient } from './client.js'
import { type PublishedMatchQuery } from '../catalog/published-matches.js'

export const publishedMatchesCacheTtlSeconds = 60

export function publishedMatchesCacheKey(query: PublishedMatchQuery): string {
  const sport = query.sport ?? 'all'
  return `pub:v1:matches:${sport}:${query.limit}:${query.offset}`
}

export async function readCachedPublishedMatches(
  cache: PublicReadCacheClient,
  load: () => Promise<PublishedMatchPage>,
  query: PublishedMatchQuery,
): Promise<PublishedMatchPage> {
  const key = publishedMatchesCacheKey(query)
  try {
    const cached = await cache.get(key)
    if (cached !== null) {
      return publishedMatchPageSchema.parse(JSON.parse(cached))
    }
  } catch {
    // A Redis failure or bad payload falls back to the catalog read.
  }
  const page = await load()
  try {
    await cache.set(key, JSON.stringify(page), publishedMatchesCacheTtlSeconds)
  } catch {
    // A store failure still returns the page the catalog returned.
  }
  return page
}
