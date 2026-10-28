import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { AdminAuthGuard } from './auth/role.guard.js'
import { CatalogError } from './catalog/catalog.js'
import { type CompetitionAdmin, type CompetitionSession } from './competition-admin.js'

export type CompetitionOpener = () => Promise<CompetitionSession>

/** Opens a competition admin session for one request. The process does not connect on boot. */
export const COMPETITION_OPENER = Symbol('COMPETITION_OPENER')

function catalogCause(error: unknown): unknown {
  if (error instanceof CatalogError) return error
  if (typeof error === 'object' && error !== null && 'cause' in error) {
    const inner = catalogCause(error.cause)
    if (inner instanceof CatalogError) return inner
  }
  return error
}

function toHttp(error: unknown): unknown {
  const cause = catalogCause(error)
  if (!(cause instanceof CatalogError)) return error
  if (cause.code === 'conflict') return new ConflictException(cause.message)
  if (cause.code === 'unknown-ref') {
    return cause.message === 'Unknown competition'
      ? new NotFoundException(cause.message)
      : new BadRequestException(cause.message)
  }
  if (cause.code === 'invalid') {
    return new BadRequestException(cause.issues?.[0]?.message ?? cause.message)
  }
  return error
}

@ApiTags('admin')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Invalid token' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@UseGuards(AdminAuthGuard)
@Controller('api/admin/competitions')
export class AdminCompetitionsController {
  constructor(@Inject(COMPETITION_OPENER) private readonly open: CompetitionOpener) {}

  @Get()
  @ApiOperation({ summary: 'List competitions' })
  list() {
    return this.run((admin) => admin.list())
  }

  @Post()
  @ApiOperation({ summary: 'Create a competition' })
  create(@Body() body: unknown) {
    return this.run((admin) => admin.create(body))
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace a competition' })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.run((admin) => admin.update(id, body))
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a competition' })
  remove(@Param('id') id: string) {
    return this.run((admin) => admin.remove(id))
  }

  private async run<T>(fn: (admin: CompetitionAdmin) => Promise<T>): Promise<T> {
    const session = await this.open()
    try {
      return await fn(session.admin)
    } catch (error) {
      throw toHttp(error)
    } finally {
      await session.close()
    }
  }
}
