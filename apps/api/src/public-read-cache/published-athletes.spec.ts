import { type AthleteName, type PublicAthlete } from '@cro-sport-hub/shared-types'
import { describe, expect, it } from 'vite-plus/test'
import { createInMemoryPublicReadCacheClient } from './client.js'
import {
  publishedAthleteListCacheKey,
  publishedAthleteProfileCacheKey,
  publishedAthletesCacheTtlSeconds,
  readCachedAthleteNameList,
  readCachedPublicAthlete,
} from './published-athletes.js'

const profile: PublicAthlete = {
  slug: 'sample-player-a',
  name: 'Sample Player A',
  sport: 'tennis',
  country: 'HR',
  clubs: [],
  results: [],
}

const names: AthleteName[] = [{ slug: 'karlo-brkic', name: 'Karlo Brkić' }]

describe('readCachedPublicAthlete', () => {
  it('loads once on a miss and serves the next identical read from cache', async () => {
    const cache = createInMemoryPublicReadCacheClient()
    let loads = 0
    const load = async () => {
      loads += 1
      return profile
    }

    await expect(readCachedPublicAthlete(cache, load, profile.slug)).resolves.toEqual(profile)
    await expect(readCachedPublicAthlete(cache, load, profile.slug)).resolves.toEqual(profile)
    expect(loads).toBe(1)
  })

  it('uses separate keys per slug', async () => {
    const cache = createInMemoryPublicReadCacheClient()
    const load = async () => profile

    await readCachedPublicAthlete(cache, load, 'sample-player-a')
    await readCachedPublicAthlete(cache, load, 'sample-player-b')

    expect([...cache.entries.keys()].sort()).toEqual(
      [
        publishedAthleteProfileCacheKey('sample-player-a'),
        publishedAthleteProfileCacheKey('sample-player-b'),
      ].sort(),
    )
  })

  it('stores the profile for sixty seconds', async () => {
    const cache = createInMemoryPublicReadCacheClient()
    await readCachedPublicAthlete(cache, async () => profile, profile.slug)
    expect(cache.entries.get(publishedAthleteProfileCacheKey(profile.slug))).toEqual({
      value: JSON.stringify(profile),
      ttlSeconds: publishedAthletesCacheTtlSeconds,
    })
  })

  it('returns the catalog profile when get throws', async () => {
    const cache = createInMemoryPublicReadCacheClient({ getError: new Error('redis down') })
    let loads = 0
    const load = async () => {
      loads += 1
      return profile
    }
    await expect(readCachedPublicAthlete(cache, load, profile.slug)).resolves.toEqual(profile)
    expect(loads).toBe(1)
  })

  it('returns the catalog profile when set throws', async () => {
    const cache = createInMemoryPublicReadCacheClient({ setError: new Error('redis down') })
    let loads = 0
    const load = async () => {
      loads += 1
      return profile
    }
    await expect(readCachedPublicAthlete(cache, load, profile.slug)).resolves.toEqual(profile)
    expect(loads).toBe(1)
  })
})

describe('readCachedAthleteNameList', () => {
  it('loads once on a miss and serves the next identical read from cache', async () => {
    const cache = createInMemoryPublicReadCacheClient()
    let loads = 0
    const load = async () => {
      loads += 1
      return names
    }

    await expect(readCachedAthleteNameList(cache, load, 'football')).resolves.toEqual(names)
    await expect(readCachedAthleteNameList(cache, load, 'football')).resolves.toEqual(names)
    expect(loads).toBe(1)
  })

  it('uses separate keys per sport', async () => {
    const cache = createInMemoryPublicReadCacheClient()
    const load = async () => names

    await readCachedAthleteNameList(cache, load, 'football')
    await readCachedAthleteNameList(cache, load, 'tennis')

    expect([...cache.entries.keys()].sort()).toEqual(
      [publishedAthleteListCacheKey('football'), publishedAthleteListCacheKey('tennis')].sort(),
    )
  })

  it('stores the list for sixty seconds', async () => {
    const cache = createInMemoryPublicReadCacheClient()
    await readCachedAthleteNameList(cache, async () => names, 'football')
    expect(cache.entries.get(publishedAthleteListCacheKey('football'))).toEqual({
      value: JSON.stringify(names),
      ttlSeconds: publishedAthletesCacheTtlSeconds,
    })
  })

  it('returns the catalog list when get throws', async () => {
    const cache = createInMemoryPublicReadCacheClient({ getError: new Error('redis down') })
    let loads = 0
    const load = async () => {
      loads += 1
      return names
    }
    await expect(readCachedAthleteNameList(cache, load, 'football')).resolves.toEqual(names)
    expect(loads).toBe(1)
  })

  it('returns the catalog list when set throws', async () => {
    const cache = createInMemoryPublicReadCacheClient({ setError: new Error('redis down') })
    let loads = 0
    const load = async () => {
      loads += 1
      return names
    }
    await expect(readCachedAthleteNameList(cache, load, 'football')).resolves.toEqual(names)
    expect(loads).toBe(1)
  })
})
