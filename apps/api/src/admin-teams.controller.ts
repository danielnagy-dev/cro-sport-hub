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
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'
import { idSchema, teamSchema } from '@cro-sport-hub/shared-types'
import { AdminAuthGuard } from './auth/role.guard.js'
import { catalogDb, CatalogError, type Catalog } from './catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from './catalog/catalog.module.js'
import { deleteTeam, listTeams, replaceTeam } from './catalog/teams.js'

const ID_MESSAGE = 'Expected an id of 1–64 letters, digits, underscores, or hyphens'

function withId(body: unknown, id: string): unknown {
  if (!idSchema.safeParse(id).success) throw new BadRequestException(ID_MESSAGE)
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { id }
  if ('id' in body && body.id !== id) {
    throw new BadRequestException('The team id is the one in the path')
  }
  return { ...body, id }
}

function bodyId(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string') {
    return body.id
  }
  throw new BadRequestException(ID_MESSAGE)
}

function catalogCause(error: unknown): unknown {
  if (error instanceof CatalogError) return error
  if (typeof error === 'object' && error !== null && 'cause' in error) {
    const inner = catalogCause(error.cause)
    if (inner instanceof CatalogError) return inner
  }
  return error
}

/** Same catalog-to-HTTP mapping as the draft routes. */
function toHttp(error: unknown): unknown {
  const cause = catalogCause(error)
  if (!(cause instanceof CatalogError)) return error
  if (cause.code === 'conflict') return new ConflictException(cause.message)
  if (cause.code === 'unknown-ref') return new NotFoundException(cause.message)
  if (cause.code === 'invalid' || cause.code === 'not-football') {
    return new BadRequestException(cause.issues?.[0]?.message ?? cause.message)
  }
  return error
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('api/admin/teams')
export class AdminTeamsController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Get()
  list() {
    return this.run((catalog) => listTeams(catalogDb(catalog)))
  }

  @Post()
  create(@Body() body: unknown) {
    return this.run(async (catalog) => {
      await catalog.write('team', body)
      const stored = await catalog.read('team', bodyId(body))
      if (stored === undefined) throw new CatalogError('unknown-ref', 'Unknown team')
      return teamSchema.parse(stored)
    })
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: 'Club id.' })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.run((catalog) => replaceTeam(catalogDb(catalog), withId(body, id)))
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiParam({ name: 'id', description: 'Club id.' })
  remove(@Param('id') id: string) {
    return this.run(async (catalog) => {
      if (!idSchema.safeParse(id).success) throw new BadRequestException(ID_MESSAGE)
      await deleteTeam(catalogDb(catalog), id)
    })
  }

  private async run<T>(work: (catalog: Catalog) => Promise<T>): Promise<T> {
    const catalog = await this.openCatalog()
    try {
      return await work(catalog)
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }
}
