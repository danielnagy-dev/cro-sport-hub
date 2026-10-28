import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { type Response } from 'express'
import { AppService } from './app.service.js'
import { HealthResponse } from './health-response.js'

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health of the API and its local Postgres and Redis' })
  @ApiOkResponse({ type: HealthResponse, description: 'Postgres and Redis are reachable.' })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    type: HealthResponse,
    description: 'Postgres or Redis is unreachable.',
  })
  async getHealth(@Res({ passthrough: true }) response: Response): Promise<HealthResponse> {
    const health = await this.appService.getHealth()
    response.status(health.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
    return health
  }
}
