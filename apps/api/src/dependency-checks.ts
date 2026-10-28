import { Client } from 'pg'
import { createClient } from 'redis'
import { type DependencyStatus } from './health-response.js'

export const dependencyProbeTimeoutMs = 500

export function createPostgresProbe(databaseUrl: string): Client {
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: dependencyProbeTimeoutMs,
    query_timeout: dependencyProbeTimeoutMs,
  })
  client.on('error', () => {
    // A drop after connect emits error. With no listener, Node exits.
  })
  return client
}

export async function checkPostgres(databaseUrl: string): Promise<DependencyStatus> {
  const client = createPostgresProbe(databaseUrl)
  try {
    await client.connect()
    await client.query('SELECT 1')
    return 'up'
  } catch {
    return 'down'
  } finally {
    await client.end().catch(() => {
      // The client may never have connected.
    })
  }
}

function createRedisProbe(redisUrl: string) {
  const client = createClient({
    url: redisUrl,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: dependencyProbeTimeoutMs,
      socketTimeout: dependencyProbeTimeoutMs,
      reconnectStrategy: false,
    },
  })
  client.on('error', () => {
    // The probe reports "down" instead of crashing on a socket error.
  })
  return client
}

export async function checkRedis(redisUrl: string): Promise<DependencyStatus> {
  const client = createRedisProbe(redisUrl)
  try {
    await client.connect()
    const reply = await client.ping()
    return reply === 'PONG' ? 'up' : 'down'
  } catch {
    return 'down'
  } finally {
    try {
      client.destroy()
    } catch {
      // Destroy throws when the client never opened.
    }
  }
}
