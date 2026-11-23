import {
  athleteNameListSchema,
  publicAthleteSchema,
  type AthleteName,
  type PublicAthlete,
} from '@cro-sport-hub/shared-types'
import { type PublicReadCacheClient } from './client.js'

export const publishedAthletesCacheTtlSeconds = 60

export function publishedAthleteProfileCacheKey(slug: string): string {
  return `pub:v1:athletes:${slug}`
}

export function publishedAthleteListCacheKey(sport: string): string {
  return `pub:v1:athletes:list:${sport}`
}

export async function readCachedPublicAthlete(
  cache: PublicReadCacheClient,
  load: () => Promise<PublicAthlete>,
  slug: string,
): Promise<PublicAthlete> {
  const key = publishedAthleteProfileCacheKey(slug)
  try {
    const cached = await cache.get(key)
    if (cached !== null) {
      return publicAthleteSchema.parse(JSON.parse(cached))
    }
  } catch {}
  const athlete = await load()
  try {
    await cache.set(key, JSON.stringify(athlete), publishedAthletesCacheTtlSeconds)
  } catch {}
  return athlete
}

export async function readCachedAthleteNameList(
  cache: PublicReadCacheClient,
  load: () => Promise<AthleteName[]>,
  sport: string,
): Promise<AthleteName[]> {
  const key = publishedAthleteListCacheKey(sport)
  try {
    const cached = await cache.get(key)
    if (cached !== null) {
      return athleteNameListSchema.parse(JSON.parse(cached))
    }
  } catch {}
  const names = await load()
  try {
    await cache.set(key, JSON.stringify(names), publishedAthletesCacheTtlSeconds)
  } catch {}
  return names
}
