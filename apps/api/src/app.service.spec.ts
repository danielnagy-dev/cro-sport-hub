import { describe, expect, it } from 'vite-plus/test'
import { AppService } from './app.service.js'

describe('AppService', () => {
  const service = new AppService()

  it('is ok only when Postgres and Redis are up', async () => {
    const health = await service.getHealth({
      postgres: async () => 'up',
      redis: async () => 'up',
    })

    expect(health).toEqual({
      status: 'ok',
      sharedTypes: '@cro-sport-hub/shared-types',
      slideGenerator: '@cro-sport-hub/slide-generator',
      postgres: 'up',
      redis: 'up',
    })
  })

  it('is an error when either dependency is down', async () => {
    const health = await service.getHealth({
      postgres: async () => 'up',
      redis: async () => 'down',
    })

    expect(health.status).toBe('error')
    expect(health.postgres).toBe('up')
    expect(health.redis).toBe('down')
  })
})
