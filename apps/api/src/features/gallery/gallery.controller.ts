import {
  applyDecorators,
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Header,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  ServiceUnavailableException,
  StreamableFile,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { z } from 'zod'
import { footballRendererReason } from '@cro-sport-hub/slide-generator'
import {
  galleryCaptionPatchSchema,
  galleryCreateBodySchema,
  galleryViewSchema,
  idSchema,
} from '@cro-sport-hub/shared-types'
import { AdminAuthGuard, EditorAuthGuard } from '../../auth/role.guard.js'
import { catalogDb, CatalogError, type Catalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import {
  createGallery,
  downloadGalleryZip,
  patchGallerySlideCaption,
  pickPublishedFootballMessage,
  publishGallery,
  readGallery,
  readGallerySlidePng,
  rejectGallery,
  renderGalleryPngs,
  submitGallery,
} from './gallery.js'

const submittedSchema = z.strictObject({
  id: idSchema,
  status: z.literal('review'),
})
const rejectedSchema = z.strictObject({
  id: idSchema,
  status: z.literal('draft'),
})
const publishedSchema = z.strictObject({
  id: idSchema,
  status: z.literal('published'),
})

function galleryWorkflowDocs(summary: string, saved: z.ZodType, conflict: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiParam({ name: 'id', description: 'Gallery id.' }),
    ApiOkResponse({ description: 'The gallery id and its new status.', standardSchema: saved }),
    ApiUnauthorizedResponse({ description: 'Invalid token' }),
    ApiForbiddenResponse({ description: 'Forbidden' }),
    ApiNotFoundResponse({ description: 'Unknown gallery' }),
    ApiConflictResponse({ description: conflict }),
  )
}

type AuthedRequest = { user?: { id: string } }

function toHttp(error: unknown): unknown {
  if (!(error instanceof CatalogError)) return error
  if (error.code === 'invalid') {
    const reason = footballRendererReason()
    if (reason !== undefined && error.message === reason) {
      return new ServiceUnavailableException(error.message)
    }
    return new BadRequestException(error.message)
  }
  if (error.code === 'conflict') return new ConflictException(error.message)
  if (error.code === 'unknown-ref') return new NotFoundException(error.message)
  return error
}

@ApiTags('galleries')
@ApiBearerAuth()
@UseGuards(EditorAuthGuard)
@Controller('api/galleries')
export class GalleryController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Post()
  async create(@Body() body: unknown, @Req() request: AuthedRequest) {
    const actorId = request.user?.id
    if (actorId === undefined) throw new UnauthorizedException('Invalid token')
    const parsed = galleryCreateBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? pickPublishedFootballMessage)
    }
    const catalog: Catalog = await this.openCatalog()
    try {
      return await createGallery(catalog, parsed.data.matchIds, actorId)
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }

  @Get(':id')
  async read(@Param('id') id: string): Promise<z.infer<typeof galleryViewSchema>> {
    if (!idSchema.safeParse(id).success) throw new NotFoundException('Unknown gallery')
    const catalog: Catalog = await this.openCatalog()
    try {
      return await readGallery(catalogDb(catalog), id)
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }

  @Patch(':id/slides/:index')
  async patchCaption(
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() body: unknown,
    @Req() request: AuthedRequest,
  ): Promise<z.infer<typeof galleryViewSchema>> {
    if (request.user?.id === undefined) throw new UnauthorizedException('Invalid token')
    if (!idSchema.safeParse(id).success) throw new NotFoundException('Unknown gallery')
    const slideIndex = Number.parseInt(index, 10)
    if (!Number.isInteger(slideIndex) || slideIndex < 0)
      throw new NotFoundException('Unknown slide')
    const parsed = galleryCaptionPatchSchema.safeParse(body)
    if (!parsed.success) throw new BadRequestException('The body does not match the shared schema')
    const catalog: Catalog = await this.openCatalog()
    try {
      await patchGallerySlideCaption(catalogDb(catalog), id, slideIndex, parsed.data.caption)
      return await readGallery(catalogDb(catalog), id)
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }

  @Post(':id/submit')
  @HttpCode(200)
  @galleryWorkflowDocs(
    'Submit a draft gallery for review',
    submittedSchema,
    'Only a draft gallery can be submitted',
  )
  async submit(@Param('id') id: string) {
    if (!idSchema.safeParse(id).success) throw new NotFoundException('Unknown gallery')
    const catalog: Catalog = await this.openCatalog()
    try {
      return submittedSchema.parse(await submitGallery(catalogDb(catalog), id))
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }

  @Post(':id/reject')
  @HttpCode(200)
  @UseGuards(AdminAuthGuard)
  @galleryWorkflowDocs(
    'Reject a gallery in review back to draft',
    rejectedSchema,
    'Only a gallery in review can be rejected',
  )
  async reject(@Param('id') id: string) {
    if (!idSchema.safeParse(id).success) throw new NotFoundException('Unknown gallery')
    const catalog: Catalog = await this.openCatalog()
    try {
      return rejectedSchema.parse(await rejectGallery(catalogDb(catalog), id))
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }

  @Post(':id/publish')
  @HttpCode(200)
  @UseGuards(AdminAuthGuard)
  @galleryWorkflowDocs(
    'Publish a gallery in review',
    publishedSchema,
    'Only a gallery in review can be published',
  )
  async publish(@Param('id') id: string, @Req() request: AuthedRequest) {
    const actorId = request.user?.id
    if (actorId === undefined) throw new UnauthorizedException('Invalid token')
    if (!idSchema.safeParse(id).success) throw new NotFoundException('Unknown gallery')
    const catalog: Catalog = await this.openCatalog()
    try {
      return publishedSchema.parse(await publishGallery(catalogDb(catalog), id, actorId))
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }

  @Post(':id/render')
  async render(@Param('id') id: string, @Req() request: AuthedRequest) {
    if (request.user?.id === undefined) throw new UnauthorizedException('Invalid token')
    if (!idSchema.safeParse(id).success) throw new NotFoundException('Unknown gallery')
    const catalog: Catalog = await this.openCatalog()
    try {
      return await renderGalleryPngs(catalogDb(catalog), id)
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }

  @Get(':id/download')
  @Header('Content-Type', 'application/zip')
  @ApiOperation({ summary: 'Download a published gallery as a ZIP of slide PNGs' })
  @ApiParam({ name: 'id', description: 'Gallery id.' })
  @ApiOkResponse({ description: 'ZIP archive with one PNG per slide in slide order.' })
  @ApiUnauthorizedResponse({ description: 'Invalid token' })
  @ApiNotFoundResponse({ description: 'Unknown gallery' })
  @ApiConflictResponse({
    description: 'Only an approved gallery can be downloaded, or gallery slides are not rendered',
  })
  async download(@Param('id') id: string) {
    if (!idSchema.safeParse(id).success) throw new NotFoundException('Unknown gallery')
    const catalog: Catalog = await this.openCatalog()
    try {
      const zip = await downloadGalleryZip(catalogDb(catalog), id)
      return new StreamableFile(zip)
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }

  @Get(':id/slides/:index.png')
  @Header('Content-Type', 'image/png')
  async readSlidePng(@Param('id') id: string, @Param('index') index: string) {
    if (!idSchema.safeParse(id).success) throw new NotFoundException('Unknown gallery')
    const slideIndex = Number.parseInt(index, 10)
    if (!Number.isInteger(slideIndex) || slideIndex < 0)
      throw new NotFoundException('Unknown slide')
    const catalog: Catalog = await this.openCatalog()
    try {
      const png = await readGallerySlidePng(catalogDb(catalog), id, slideIndex)
      return new StreamableFile(png)
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }
}
