import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { idSchema } from '@cro-sport-hub/shared-types'
import { EditorAuthGuard } from '../../auth/role.guard.js'
import { catalogDb, CatalogError, type Catalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import { previewPublishSlotSlides, slidePreviewsResponseSchema } from './slide-preview.js'

function toHttp(error: unknown): unknown {
  if (!(error instanceof CatalogError)) return error
  if (error.code === 'unknown-ref') return new NotFoundException(error.message)
  if (error.code === 'invalid') {
    return new BadRequestException(error.issues?.[0]?.message ?? error.message)
  }
  return error
}

@ApiTags('slide-previews')
@ApiBearerAuth()
@UseGuards(EditorAuthGuard)
@Controller('api/editor/publish-slots')
export class SlidePreviewController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Get(':id/slide-previews')
  @ApiOperation({ summary: 'HTML slide previews for a publish slot slideOrder.' })
  @ApiOkResponse({ standardSchema: slidePreviewsResponseSchema })
  preview(@Param('id') id: string) {
    if (!idSchema.safeParse(id).success) {
      throw new BadRequestException(
        'Expected an id of 1–64 letters, digits, underscores, or hyphens',
      )
    }
    return this.run((catalog) => previewPublishSlotSlides(catalogDb(catalog), id))
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
