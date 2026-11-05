import {
  applyDecorators,
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import {
  matchListQuerySchema,
  publishedMatchPageSchema,
  type PublishedMatchPage,
} from '@cro-sport-hub/shared-types'
import { CATALOG_OPENER, type CatalogOpener } from './catalog/catalog.module.js'
import { catalogDb } from './catalog/catalog.js'
import {
  UnknownSportError,
  unknownSportMessage,
  listPublishedMatches,
  type PublishedMatchQuery,
} from './catalog/published-matches.js'
import { PUBLIC_READ_CACHE, type PublicReadCacheClient } from './public-read-cache/client.js'
import { readCachedPublishedMatches } from './public-read-cache/published-matches.js'

const pageMessage = 'limit is 1 to 50 and offset is 0 or greater'

function pageDocs(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiQuery({
      name: 'limit',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
    }),
    ApiQuery({
      name: 'offset',
      required: false,
      schema: { type: 'integer', minimum: 0, default: 0 },
    }),
    ApiOkResponse({
      description: 'Published matches, newest first.',
      standardSchema: publishedMatchPageSchema,
    }),
    ApiBadRequestResponse({ description: pageMessage }),
  )
}

function sportDocs() {
  return applyDecorators(
    pageDocs('Published matches for one sport'),
    ApiParam({
      name: 'sport',
      description: 'Sport slug.',
      schema: { type: 'string', enum: ['tennis', 'football'] },
    }),
    ApiNotFoundResponse({ description: unknownSportMessage }),
  )
}

@ApiTags('matches')
@Controller('api')
export class MatchesController {
  constructor(
    @Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener,
    @Inject(PUBLIC_READ_CACHE) private readonly cache: PublicReadCacheClient,
  ) {}

  @Get('matches')
  @pageDocs('Latest published matches')
  latest(@Query() query: Record<string, unknown>): Promise<PublishedMatchPage> {
    return this.readPublished(readPage(query))
  }

  @Get('matches/:sport')
  @sportDocs()
  async bySport(
    @Param('sport') sport: string,
    @Query() query: Record<string, unknown>,
  ): Promise<PublishedMatchPage> {
    try {
      return await this.readPublished({ ...readPage(query), sport })
    } catch (error) {
      if (error instanceof UnknownSportError) throw new NotFoundException(error.message)
      throw error
    }
  }

  private readPublished(query: PublishedMatchQuery): Promise<PublishedMatchPage> {
    return readCachedPublishedMatches(this.cache, () => this.loadPublished(query), query)
  }

  private async loadPublished(query: PublishedMatchQuery): Promise<PublishedMatchPage> {
    const catalog = await this.openCatalog()
    try {
      return await listPublishedMatches(catalogDb(catalog), query)
    } finally {
      await catalog.close()
    }
  }
}

function readPage(query: Record<string, unknown>): { limit: number; offset: number } {
  const limit = query.limit === undefined ? '20' : query.limit
  const offset = query.offset === undefined ? '0' : query.offset
  if (typeof limit !== 'string' || typeof offset !== 'string') {
    throw new BadRequestException(pageMessage)
  }
  const parsed = matchListQuerySchema.safeParse({ limit, offset })
  if (!parsed.success) throw new BadRequestException(pageMessage)
  return parsed.data
}
