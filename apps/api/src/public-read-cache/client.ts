import { createClient } from 'redis'

export const PUBLIC_READ_CACHE = Symbol('PUBLIC_READ_CACHE')

export type PublicReadCacheClient = {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  deleteByPrefix(prefix: string): Promise<void>
}

export function createRedisPublicReadCacheClient(redisUrl: string): PublicReadCacheClient {
  const client = createClient({ url: redisUrl })
  client.on('error', () => {
    // Handlers fall back to the catalog when Redis is down.
  })
  let connect: Promise<unknown> | undefined
  function ensureConnected(): Promise<unknown> {
    connect ??= client.connect()
    return connect
  }
  return {
    async get(key) {
      await ensureConnected()
      return client.get(key)
    },
    async set(key, value, ttlSeconds) {
      await ensureConnected()
      await client.set(key, value, { EX: ttlSeconds })
    },
    async deleteByPrefix(prefix) {
      await ensureConnected()
      const keys: string[] = []
      for await (const batch of client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
        if (Array.isArray(batch)) {
          keys.push(...batch)
        } else {
          keys.push(batch)
        }
      }
      if (keys.length > 0) {
        await client.del(keys)
      }
    },
  }
}

type InMemoryOptions = {
  getError?: Error
  setError?: Error
  deleteByPrefixError?: Error
}

export function createInMemoryPublicReadCacheClient(
  options: InMemoryOptions = {},
): PublicReadCacheClient & { entries: Map<string, { value: string; ttlSeconds: number }> } {
  const entries = new Map<string, { value: string; ttlSeconds: number }>()
  return {
    entries,
    async get(key) {
      if (options.getError !== undefined) throw options.getError
      return entries.get(key)?.value ?? null
    },
    async set(key, value, ttlSeconds) {
      if (options.setError !== undefined) throw options.setError
      entries.set(key, { value, ttlSeconds })
    },
    async deleteByPrefix(prefix) {
      if (options.deleteByPrefixError !== undefined) throw options.deleteByPrefixError
      for (const key of entries.keys()) {
        if (key.startsWith(prefix)) {
          entries.delete(key)
        }
      }
    },
  }
}
