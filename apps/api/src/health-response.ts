import 'reflect-metadata'
import { ApiProperty } from '@nestjs/swagger'

export type DependencyStatus = 'up' | 'down'

export class HealthResponse {
  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  status: 'ok' | 'error'

  @ApiProperty({ example: '@cro-sport-hub/shared-types' })
  sharedTypes: string

  @ApiProperty({ example: '@cro-sport-hub/slide-generator' })
  slideGenerator: string

  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  postgres: DependencyStatus

  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  redis: DependencyStatus
}
