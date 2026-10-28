import { Injectable } from '@nestjs/common'
import { packageId as sharedTypesPackageId } from '@cro-sport-hub/shared-types'
import { packageId as slideGeneratorPackageId } from '@cro-sport-hub/slide-generator'
import { readApiConfig } from './api-config.js'
import { checkPostgres, checkRedis } from './dependency-checks.js'
import { type DependencyStatus, type HealthResponse } from './health-response.js'

export type DependencyChecks = {
  postgres: () => Promise<DependencyStatus>
  redis: () => Promise<DependencyStatus>
}

@Injectable()
export class AppService {
  async getHealth(checks: DependencyChecks = defaultDependencyChecks()): Promise<HealthResponse> {
    const [postgres, redis] = await Promise.all([checks.postgres(), checks.redis()])
    return {
      status: postgres === 'up' && redis === 'up' ? 'ok' : 'error',
      sharedTypes: sharedTypesPackageId,
      slideGenerator: slideGeneratorPackageId,
      postgres,
      redis,
    }
  }
}

function defaultDependencyChecks(): DependencyChecks {
  const config = readApiConfig()
  return {
    postgres: () => checkPostgres(config.databaseUrl),
    redis: () => checkRedis(config.redisUrl),
  }
}
