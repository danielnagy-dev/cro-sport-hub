import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { idSchema } from '@cro-sport-hub/shared-types'
import { EditorAuthGuard } from '../../auth/role.guard.js'
import { catalogDb, CatalogError, type Catalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import {
  attachAppearanceSource,
  createSource,
  listAppearanceSources,
  MISSING_APPEARANCE_MESSAGE,
  setAppearanceSourceDisagreement,
  type AppearanceSourceAttachment,
  type Source,
} from './sources.js'

function toHttp(error: unknown): unknown {
  if (!(error instanceof CatalogError)) return error
  if (error.code === 'conflict') return new ConflictException(error.message)
  if (error.code === 'unknown-ref') return new NotFoundException(error.message)
  if (error.code === 'invalid' || error.code === 'not-football') {
    return new BadRequestException(error.issues?.[0]?.message ?? error.message)
  }
  return error
}

@ApiTags('sources')
@ApiBearerAuth()
@UseGuards(EditorAuthGuard)
@Controller('api/editor/sources')
export class SourcesController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Post()
  create(@Body() body: unknown): Promise<Source> {
    return this.run((catalog) => createSource(catalogDb(catalog), body))
  }

  @Get()
  @ApiQuery({ name: 'appearanceId', required: true, description: 'Appearance id.' })
  list(@Query('appearanceId') appearanceId: unknown): Promise<AppearanceSourceAttachment[]> {
    if (typeof appearanceId !== 'string' || appearanceId.length === 0) {
      throw new BadRequestException(MISSING_APPEARANCE_MESSAGE)
    }
    return this.run((catalog) => listAppearanceSources(catalogDb(catalog), appearanceId))
  }

  @Post('attachments')
  attach(@Body() body: unknown): Promise<AppearanceSourceAttachment> {
    return this.run((catalog) => attachAppearanceSource(catalogDb(catalog), body))
  }

  @Patch('attachments/:appearanceId/:sourceId')
  @ApiParam({ name: 'appearanceId', description: 'Appearance id.' })
  @ApiParam({ name: 'sourceId', description: 'Source id.' })
  setDisagreement(
    @Param('appearanceId') appearanceId: string,
    @Param('sourceId') sourceId: string,
    @Body() body: unknown,
  ): Promise<AppearanceSourceAttachment> {
    if (!idSchema.safeParse(appearanceId).success) {
      throw new BadRequestException(MISSING_APPEARANCE_MESSAGE)
    }
    if (!idSchema.safeParse(sourceId).success) {
      throw new BadRequestException('Expected a source id')
    }
    return this.run((catalog) =>
      setAppearanceSourceDisagreement(catalogDb(catalog), appearanceId, sourceId, body),
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
