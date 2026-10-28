import { createServer, type Socket } from 'node:net'
import { describe, expect, it } from 'vite-plus/test'
import {
  checkPostgres,
  checkRedis,
  createPostgresProbe,
  dependencyProbeTimeoutMs,
} from './dependency-checks.js'

describe('dependency checks', () => {
  it('reports Postgres down when the port is closed', async () => {
    await expect(
      checkPostgres('postgresql://cro_sport:closed-port-password@127.0.0.1:1/cro_sport'),
    ).resolves.toBe('down')
  })

  it('bounds the health query and swallows a dropped Postgres connection', () => {
    const client = createPostgresProbe(
      'postgresql://cro_sport:probe-password@127.0.0.1:1/cro_sport',
    )
    const parameters = client as unknown as {
      connectionParameters: { query_timeout?: number }
      _connectionTimeoutMillis: number
    }
    expect(parameters.connectionParameters.query_timeout).toBe(dependencyProbeTimeoutMs)
    expect(parameters._connectionTimeoutMillis).toBe(dependencyProbeTimeoutMs)
    expect(client.emit('error', new Error('connection dropped'))).toBe(true)
    void client.end().catch(() => undefined)
  })

  it('reports Redis down when the port is closed', async () => {
    await expect(checkRedis('redis://127.0.0.1:1')).resolves.toBe('down')
  })

  it('reports Redis down when the server accepts and never answers', async () => {
    const sockets = new Set<Socket>()
    const server = createServer((socket) => {
      sockets.add(socket)
      socket.on('error', () => undefined)
      socket.on('close', () => sockets.delete(socket))
    })
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (address === null || typeof address === 'string') {
      throw new Error('Expected a TCP port')
    }
    try {
      await expect(checkRedis(`redis://127.0.0.1:${address.port}`)).resolves.toBe('down')
    } finally {
      for (const socket of sockets) {
        socket.destroy()
      }
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
  })
})
