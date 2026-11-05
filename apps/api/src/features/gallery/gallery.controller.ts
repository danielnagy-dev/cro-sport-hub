import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import {
  galleryCaptionPatchSchema,
  galleryCreateBodySchema,
  galleryViewSchema,
  idSchema,
} from '@cro-sport-hub/shared-types'
import { EditorAuthGuard } from '../../auth/role.guard.js'
import { catalogDb, CatalogError, type Catalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import {
  createGallery,
  patchGallerySlideCaption,
  pickPublishedFootballMessage,
  readGallery,
} from './gallery.js'

type AuthedRequest = { user?: { id: string } }

function toHttp(error: unknown): unknown {
  if (!(error instanceof CatalogError)) return error
  if (error.code === 'invalid') return new BadRequestException(error.message)
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
}
