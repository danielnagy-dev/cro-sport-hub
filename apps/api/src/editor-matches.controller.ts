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
  editorMatchListQuerySchema,
  editorMatchPageSchema,
  type EditorMatchListQuery,
  type EditorMatchPage,
} from '@cro-sport-hub/shared-types'
import { EditorAuthGuard } from './auth/role.guard.js'
import { CATALOG_OPENER, type CatalogOpener } from './matches.controller.js'

const queryMessage =
  'sport is tennis or football, status is draft, review, or published, source is manual or import, limit is 1 to 50, and offset is 0 or greater'

const filters = ['sport', 'status', 'source'] as const

function queryParam(name: string, schema: Record<string, unknown>) {
  return ApiQuery({ name, required: false, schema })
}

function editorDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Editorial matches across tennis and football' }),
    queryParam('sport', { type: 'string', enum: ['tennis', 'football'] }),
    queryParam('status', { type: 'string', enum: ['draft', 'review', 'published'] }),
    queryParam('source', { type: 'string', enum: ['manual', 'import'] }),
    queryParam('limit', { type: 'integer', minimum: 1, maximum: 50, default: 20 }),
    queryParam('offset', { type: 'integer', minimum: 0, default: 0 }),
    ApiOkResponse({
      description: 'Matches in every workflow state, newest first.',
      standardSchema: editorMatchPageSchema,
    }),
    ApiBadRequestResponse({ description: queryMessage }),
    ApiUnauthorizedResponse({ description: 'Invalid token' }),
    ApiForbiddenResponse({ description: 'Forbidden' }),
  )
}

@ApiTags('matches')
@UseGuards(EditorAuthGuard)
@Controller('api/editor')
export class EditorMatchesController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Get('matches')
  @editorDocs()
  list(@Query() query: Record<string, unknown>): Promise<EditorMatchPage> {
    return this.read(readEditorQuery(query))
  }

  private async read(query: EditorMatchListQuery): Promise<EditorMatchPage> {
    const catalog = await this.openCatalog()
    try {
      return await catalog.listEditorMatches(query)
    } finally {
      await catalog.close()
    }
  }
}

function readEditorQuery(query: Record<string, unknown>): EditorMatchListQuery {
  const input: Record<string, unknown> = {
    limit: query.limit === undefined ? '20' : query.limit,
    offset: query.offset === undefined ? '0' : query.offset,
  }
  for (const key of filters) {
    if (query[key] !== undefined) input[key] = query[key]
  }
  if (Object.values(input).some((value) => typeof value !== 'string')) {
    throw new BadRequestException(queryMessage)
  }
  const parsed = editorMatchListQuerySchema.safeParse(input)
  if (!parsed.success) throw new BadRequestException(queryMessage)
  return parsed.data
}
