import {
  applyDecorators,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common'
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import {
  athleteNameListSchema,
  publicAthleteSchema,
  type AthleteName,
  type PublicAthlete,
} from '@cro-sport-hub/shared-types'
import { catalogDb, type Catalog } from './catalog/catalog.js'
import {
  listPublicAthletes,
  readPublicAthlete,
  UnknownAthleteError,
  unknownAthleteMessage,
} from './catalog/published-athletes.js'
import { UnknownSportError, unknownSportMessage } from './catalog/published-matches.js'
import { CATALOG_OPENER, type CatalogOpener } from './catalog/catalog.module.js'

function profileDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Public athlete profile and club history' }),
    ApiParam({ name: 'slug', description: 'Athlete slug.' }),
    ApiOkResponse({
      description:
        'Profile and club names. Tennis bodies include published match results; football bodies have no results field.',
      standardSchema: publicAthleteSchema,
    }),
    ApiNotFoundResponse({ description: unknownAthleteMessage }),
  )
}

function listDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Athlete names for one sport' }),
    ApiQuery({
      name: 'sport',
      required: true,
      description: 'Sport slug.',
      schema: { type: 'string', enum: ['tennis', 'football'] },
    }),
    ApiOkResponse({
      description: 'Slug and name, sorted by name.',
      standardSchema: athleteNameListSchema,
    }),
    ApiNotFoundResponse({ description: unknownSportMessage }),
  )
}

@ApiTags('athletes')
@Controller('api')
export class AthletesController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Get('athletes')
  @listDocs()
  list(@Query('sport') sport: unknown): Promise<AthleteName[]> {
    if (typeof sport !== 'string' || sport.length === 0) {
      throw new NotFoundException(unknownSportMessage)
    }
    return this.read((catalog) => listPublicAthletes(catalogDb(catalog), sport))
  }

  @Get('athletes/:slug')
  @profileDocs()
  profile(@Param('slug') slug: string): Promise<PublicAthlete> {
    return this.read((catalog) => readPublicAthlete(catalogDb(catalog), slug))
  }

  private async read<T>(load: (catalog: Catalog) => Promise<T>): Promise<T> {
    const catalog = await this.openCatalog()
    try {
      return await load(catalog)
    } catch (error) {
      if (error instanceof UnknownAthleteError || error instanceof UnknownSportError) {
        throw new NotFoundException(error.message)
      }
      throw error
    } finally {
      await catalog.close()
    }
  }
}
