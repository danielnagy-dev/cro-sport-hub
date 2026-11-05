import { type PublicReadCacheClient } from './client.js'

export const publicReadCacheKeyPrefix = 'pub:v1:'

export async function invalidatePublicReads(cache: PublicReadCacheClient): Promise<void> {
  try {
    await cache.deleteByPrefix(publicReadCacheKeyPrefix)
  } catch (error) {
    console.error('Failed to invalidate public read cache', error)
  }
}
