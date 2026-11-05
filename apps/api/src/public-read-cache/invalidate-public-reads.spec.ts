import { describe, expect, it, vi } from 'vite-plus/test'
import { createInMemoryPublicReadCacheClient } from './client.js'
import { invalidatePublicReads } from './invalidate-public-reads.js'
import { publishedMatchesCacheKey } from './published-matches.js'
import {
  publishedAthleteListCacheKey,
  publishedAthleteProfileCacheKey,
} from './published-athletes.js'

describe('invalidatePublicReads', () => {
  it('removes public athlete and match keys so the next read misses', async () => {
    const cache = createInMemoryPublicReadCacheClient()
    await cache.set(publishedAthleteProfileCacheKey('sample-player-a'), '{}', 60)
    await cache.set(publishedAthleteListCacheKey('tennis'), '[]', 60)
    await cache.set(publishedMatchesCacheKey({ limit: 20, offset: 0 }), '{}', 60)

    await invalidatePublicReads(cache)

    expect(await cache.get(publishedAthleteProfileCacheKey('sample-player-a'))).toBeNull()
    expect(await cache.get(publishedAthleteListCacheKey('tennis'))).toBeNull()
    expect(await cache.get(publishedMatchesCacheKey({ limit: 20, offset: 0 }))).toBeNull()
  })

  it('leaves keys that do not start with pub:v1:', async () => {
    const cache = createInMemoryPublicReadCacheClient()
    await cache.set('session:abc', 'token', 60)
    await cache.set(publishedAthleteProfileCacheKey('sample-player-a'), '{}', 60)

    await invalidatePublicReads(cache)

    expect(await cache.get('session:abc')).toBe('token')
    expect(await cache.get(publishedAthleteProfileCacheKey('sample-player-a'))).toBeNull()
  })

  it('does not throw when delete fails', async () => {
    const cache = createInMemoryPublicReadCacheClient({
      deleteByPrefixError: new Error('redis down'),
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(invalidatePublicReads(cache)).resolves.toBeUndefined()
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})
