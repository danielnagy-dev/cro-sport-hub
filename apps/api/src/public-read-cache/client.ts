import { createClient } from 'redis'

export const PUBLIC_READ_CACHE = Symbol('PUBLIC_READ_CACHE')

export type PublicReadCacheClient = {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
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
  }
}

type InMemoryOptions = {
  getError?: Error
  setError?: Error
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
  }
}
