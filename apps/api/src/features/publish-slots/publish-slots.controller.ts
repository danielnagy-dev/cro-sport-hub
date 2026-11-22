import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { idSchema } from '@cro-sport-hub/shared-types'
import { EditorAuthGuard } from '../../auth/role.guard.js'
import { catalogDb, CatalogError, type Catalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import {
  approvePublishSlot,
  getNextPublishSlot,
  listPublishSlotsForDay,
  patchPublishSlot,
  publishSlotDayQuerySchema,
  type PublishSlot,
} from './publish-slots.js'

function toHttp(error: unknown): unknown {
  if (!(error instanceof CatalogError)) return error
  if (error.code === 'unknown-ref') return new NotFoundException(error.message)
  if (error.code === 'invalid' || error.code === 'not-football') {
    return new BadRequestException(error.issues?.[0]?.message ?? error.message)
  }
  return error
}

function requireId(id: string): void {
  if (!idSchema.safeParse(id).success) {
    throw new BadRequestException('Expected an id of 1–64 letters, digits, underscores, or hyphens')
  }
}

@ApiTags('publish-slots')
@ApiBearerAuth()
@UseGuards(EditorAuthGuard)
@Controller('api/editor/publish-slots')
export class PublishSlotsController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Get()
  list(@Query('day') day: unknown): Promise<PublishSlot[]> {
    const parsed = publishSlotDayQuerySchema.safeParse({ day })
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Invalid day query')
    }
    return this.run((catalog) => listPublishSlotsForDay(catalogDb(catalog), parsed.data))
  }
  @Get('next')
  next(): Promise<PublishSlot> {
    return this.run(async (catalog) => {
      const slot = await getNextPublishSlot(catalogDb(catalog))
      if (slot === null) throw new NotFoundException('No upcoming publish slot')
      return slot
    })
  }
  @Patch(':id')
  patch(@Param('id') id: string, @Body() body: unknown): Promise<PublishSlot> {
    requireId(id)
    return this.run((catalog) => patchPublishSlot(catalogDb(catalog), id, body))
  }
  @Post(':id/approve')
  @HttpCode(200)
  approve(@Param('id') id: string): Promise<PublishSlot> {
    requireId(id)
    return this.run((catalog) => approvePublishSlot(catalogDb(catalog), id))
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
