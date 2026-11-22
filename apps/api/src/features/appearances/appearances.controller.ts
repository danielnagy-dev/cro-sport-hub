import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'
import { idSchema } from '@cro-sport-hub/shared-types'
import { EditorAuthGuard } from '../../auth/role.guard.js'
import { catalogDb, CatalogError, type Catalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import {
  appearanceListQuerySchema,
  createAppearance,
  createLineupEntry,
  listAppearances,
  type Appearance,
  type LineupEntry,
  updateAppearance,
  updateLineupEntry,
} from './appearances.js'

const ID_MESSAGE = 'Expected an id of 1–64 letters, digits, underscores, or hyphens'

function withId(body: unknown, id: string): unknown {
  if (!idSchema.safeParse(id).success) {
    throw new BadRequestException(ID_MESSAGE)
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { id }
  if ('id' in body && body.id !== id) {
    throw new BadRequestException('The appearance id is the one in the path')
  }
  return { ...body, id }
}

function withLineupKey(body: unknown, appearanceId: string, athleteId?: string): unknown {
  if (!idSchema.safeParse(appearanceId).success) throw new BadRequestException(ID_MESSAGE)
  if (athleteId !== undefined && !idSchema.safeParse(athleteId).success) {
    throw new BadRequestException(ID_MESSAGE)
  }
  const base = typeof body === 'object' && body !== null && !Array.isArray(body) ? { ...body } : {}
  if ('appearanceId' in base && base.appearanceId !== appearanceId) {
    throw new BadRequestException('The appearance id is the one in the path')
  }
  if (athleteId !== undefined && 'athleteId' in base && base.athleteId !== athleteId) {
    throw new BadRequestException('The athlete id is the one in the path')
  }
  return {
    ...base,
    appearanceId,
    ...(athleteId === undefined ? {} : { athleteId }),
  }
}

function toHttp(error: unknown): unknown {
  if (!(error instanceof CatalogError)) return error
  if (error.code === 'conflict') return new ConflictException(error.message)
  if (error.code === 'unknown-ref') return new NotFoundException(error.message)
  if (error.code === 'invalid' || error.code === 'not-football') {
    return new BadRequestException(error.issues?.[0]?.message ?? error.message)
  }
  return error
}

function pick(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

@ApiTags('appearances')
@ApiBearerAuth()
@UseGuards(EditorAuthGuard)
@Controller('api/editor/appearances')
export class AppearancesController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Get()
  list(
    @Query('day') day: unknown,
    @Query('sportSlug') sportSlug: unknown,
    @Query('athleteId') athleteId: unknown,
    @Query('athleteSlug') athleteSlug: unknown,
    @Query('nationalTeamId') nationalTeamId: unknown,
    @Query('from') from: unknown,
    @Query('to') to: unknown,
  ): Promise<Appearance[]> {
    const query = {
      day: pick(day),
      sportSlug: pick(sportSlug),
      athleteId: pick(athleteId),
      athleteSlug: pick(athleteSlug),
      nationalTeamId: pick(nationalTeamId),
      from: pick(from),
      to: pick(to),
    }
    const parsed = appearanceListQuerySchema.safeParse(
      Object.fromEntries(Object.entries(query).filter((entry) => entry[1] !== undefined)),
    )
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Invalid list query')
    }
    return this.run((catalog) => listAppearances(catalogDb(catalog), parsed.data))
  }

  @Post()
  create(@Body() body: unknown): Promise<Appearance> {
    return this.run((catalog) => createAppearance(catalogDb(catalog), body))
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: 'Appearance id.' })
  update(@Param('id') id: string, @Body() body: unknown): Promise<Appearance> {
    return this.run((catalog) => updateAppearance(catalogDb(catalog), id, withId(body, id)))
  }

  @Post(':id/lineup')
  @ApiParam({ name: 'id', description: 'Appearance id.' })
  createLineup(@Param('id') id: string, @Body() body: unknown): Promise<LineupEntry> {
    return this.run((catalog) => createLineupEntry(catalogDb(catalog), withLineupKey(body, id)))
  }

  @Put(':id/lineup/:athleteId')
  @ApiParam({ name: 'id', description: 'Appearance id.' })
  @ApiParam({ name: 'athleteId', description: 'Athlete id.' })
  updateLineup(
    @Param('id') id: string,
    @Param('athleteId') athleteId: string,
    @Body() body: unknown,
  ): Promise<LineupEntry> {
    return this.run((catalog) =>
      updateLineupEntry(catalogDb(catalog), id, athleteId, withLineupKey(body, id, athleteId)),
    )
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
