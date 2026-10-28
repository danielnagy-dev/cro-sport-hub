import {
  applyDecorators,
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import {
  athleteLookupSchema,
  competitionLookupSchema,
  sportSlugSchema,
  teamLookupSchema,
  type SportSlug,
} from '@cro-sport-hub/shared-types'
import { z } from 'zod'
import { EditorAuthGuard } from './auth/role.guard.js'
import { catalogDb, type Catalog } from './catalog/catalog.js'
import { selectAthletes, selectCompetitions, selectTeams } from './catalog/editor-lookups.js'
import { unknownSportMessage } from './catalog/published-matches.js'
import { CATALOG_OPENER, type CatalogOpener } from './matches.controller.js'

function lookupDocs(summary: string, item: z.ZodType) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary }),
    ApiOkResponse({ description: 'Ids and names, in name order.', standardSchema: z.array(item) }),
    ApiUnauthorizedResponse({ description: 'Invalid token' }),
    ApiForbiddenResponse({ description: 'Forbidden' }),
  )
}

function sportLookupDocs(summary: string, item: z.ZodType) {
  return applyDecorators(
    lookupDocs(summary, item),
    ApiQuery({
      name: 'sport',
      required: true,
      schema: { type: 'string', enum: ['tennis', 'football'] },
    }),
    ApiBadRequestResponse({ description: unknownSportMessage }),
  )
}

function readSport(sport: unknown): SportSlug {
  const parsed = sportSlugSchema.safeParse(sport)
  if (!parsed.success) throw new BadRequestException(unknownSportMessage)
  return parsed.data
}

@ApiTags('editor')
@UseGuards(EditorAuthGuard)
@Controller('api/editor')
export class EditorLookupsController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Get('competitions')
  @sportLookupDocs('Competitions for one sport', competitionLookupSchema)
  competitions(@Query('sport') sport: unknown) {
    const slug = readSport(sport)
    return this.read((catalog) => selectCompetitions(catalogDb(catalog), slug))
  }

  @Get('athletes')
  @sportLookupDocs('Athletes for one sport', athleteLookupSchema)
  athletes(@Query('sport') sport: unknown) {
    const slug = readSport(sport)
    return this.read((catalog) => selectAthletes(catalogDb(catalog), slug))
  }

  @Get('teams')
  @lookupDocs('Football clubs', teamLookupSchema)
  teams() {
    return this.read((catalog) => selectTeams(catalogDb(catalog)))
  }

  private async read<T>(load: (catalog: Catalog) => Promise<T>): Promise<T> {
    const catalog = await this.openCatalog()
    try {
      return await load(catalog)
    } finally {
      await catalog.close()
    }
  }
}
