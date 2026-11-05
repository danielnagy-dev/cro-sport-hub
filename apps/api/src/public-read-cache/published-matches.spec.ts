import { type PublishedMatchPage } from '@cro-sport-hub/shared-types'
import { describe, expect, it } from 'vite-plus/test'
import { createInMemoryPublicReadCacheClient } from './client.js'
import {
  publishedMatchesCacheKey,
  publishedMatchesCacheTtlSeconds,
  readCachedPublishedMatches,
} from './published-matches.js'

const page: PublishedMatchPage = {
  items: [],
  limit: 20,
  offset: 0,
  total: 0,
}

describe('readCachedPublishedMatches', () => {
  it('loads once on a miss and serves the next identical read from cache', async () => {
    const cache = createInMemoryPublicReadCacheClient()
    let loads = 0
    const load = async () => {
      loads += 1
      return page
    }
    const query = { limit: 20, offset: 0 }

    await expect(readCachedPublishedMatches(cache, load, query)).resolves.toEqual(page)
    await expect(readCachedPublishedMatches(cache, load, query)).resolves.toEqual(page)
    expect(loads).toBe(1)
  })

  it('uses separate keys for sport and pagination', async () => {
    const cache = createInMemoryPublicReadCacheClient()
    const load = async () => page

    await readCachedPublishedMatches(cache, load, { limit: 20, offset: 0 })
    await readCachedPublishedMatches(cache, load, { limit: 20, offset: 0, sport: 'football' })
    await readCachedPublishedMatches(cache, load, { limit: 20, offset: 0, sport: 'tennis' })
    await readCachedPublishedMatches(cache, load, { limit: 1, offset: 0 })

    expect([...cache.entries.keys()].sort()).toEqual(
      [
        publishedMatchesCacheKey({ limit: 20, offset: 0 }),
        publishedMatchesCacheKey({ limit: 20, offset: 0, sport: 'football' }),
        publishedMatchesCacheKey({ limit: 20, offset: 0, sport: 'tennis' }),
        publishedMatchesCacheKey({ limit: 1, offset: 0 }),
      ].sort(),
    )
  })

  it('stores the page for sixty seconds', async () => {
    const cache = createInMemoryPublicReadCacheClient()
    await readCachedPublishedMatches(cache, async () => page, { limit: 20, offset: 0 })
    expect(cache.entries.get(publishedMatchesCacheKey({ limit: 20, offset: 0 }))).toEqual({
      value: JSON.stringify(page),
      ttlSeconds: publishedMatchesCacheTtlSeconds,
    })
  })

  it('returns the catalog page when get throws', async () => {
    const cache = createInMemoryPublicReadCacheClient({ getError: new Error('redis down') })
    let loads = 0
    const load = async () => {
      loads += 1
      return page
    }
    await expect(
      readCachedPublishedMatches(cache, load, { limit: 20, offset: 0 }),
    ).resolves.toEqual(page)
    expect(loads).toBe(1)
  })

  it('returns the catalog page when set throws', async () => {
    const cache = createInMemoryPublicReadCacheClient({ setError: new Error('redis down') })
    let loads = 0
    const load = async () => {
      loads += 1
      return page
    }
    await expect(
      readCachedPublishedMatches(cache, load, { limit: 20, offset: 0 }),
    ).resolves.toEqual(page)
    expect(loads).toBe(1)
  })
})
