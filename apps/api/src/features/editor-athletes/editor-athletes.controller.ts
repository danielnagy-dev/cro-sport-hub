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
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { idSchema } from '@cro-sport-hub/shared-types'
import { EditorAuthGuard } from '../../auth/role.guard.js'
import { catalogDb, CatalogError, type Catalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import { editorAthleteListQuerySchema, type EditorAthlete } from './editor-athlete.js'
import { createAthlete, listEditorAthletes, updateAthlete } from './editor-athletes.js'

const ID_MESSAGE = 'Expected an id of 1–64 letters, digits, underscores, or hyphens'

function withId(body: unknown, id: string): unknown {
  if (!idSchema.safeParse(id).success) throw new BadRequestException(ID_MESSAGE)
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { id }
  if ('id' in body && body.id !== id) {
    throw new BadRequestException('The athlete id is the one in the path')
  }
  return { ...body, id }
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

@ApiTags('editor-athletes')
@ApiBearerAuth()
@UseGuards(EditorAuthGuard)
@Controller('api/editor/tracked-athletes')
export class EditorAthletesController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Get()
  @ApiQuery({
    name: 'sport',
    required: true,
    schema: { type: 'string', enum: ['tennis', 'football', 'basketball'] },
  })
  @ApiQuery({ name: 'q', required: false })
  list(@Query('sport') sport: unknown, @Query('q') q: unknown): Promise<EditorAthlete[]> {
    const parsed = editorAthleteListQuerySchema.safeParse({
      sport,
      ...(typeof q === 'string' && q.length > 0 ? { q } : {}),
    })
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Invalid list query')
    }
    return this.run((catalog) => listEditorAthletes(catalogDb(catalog), parsed.data))
  }

  @Post()
  create(@Body() body: unknown): Promise<EditorAthlete> {
    return this.run((catalog) => createAthlete(catalogDb(catalog), body))
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: 'Athlete id.' })
  update(@Param('id') id: string, @Body() body: unknown): Promise<EditorAthlete> {
    return this.run((catalog) => updateAthlete(catalogDb(catalog), id, withId(body, id)))
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
