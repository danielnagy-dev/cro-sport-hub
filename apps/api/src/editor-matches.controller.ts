import {
  applyDecorators,
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import {
  editorMatchListQuerySchema,
  editorMatchPageSchema,
  editorFootballDraftSchema,
  editorTennisDraftSchema,
  idSchema,
  type EditorFootballDraft,
  type EditorMatchListQuery,
  type EditorMatchPage,
  type EditorTennisDraft,
} from '@cro-sport-hub/shared-types'
import { EditorAuthGuard } from './auth/role.guard.js'
import { catalogDb, CatalogError } from './catalog/catalog.js'
import { readEditorFootballDraft } from './catalog/editor-football-draft.js'
import { readEditorTennisDraft } from './catalog/editor-tennis-draft.js'
import { listEditorMatches } from './catalog/editor-matches.js'
import { CATALOG_OPENER, type CatalogOpener } from './catalog/catalog.module.js'

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

function readTennisDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Read one tennis match for editing' }),
    ApiParam({ name: 'id', description: 'Match id.' }),
    ApiOkResponse({
      description: 'Draft body the tennis POST accepts, plus status.',
      standardSchema: editorTennisDraftSchema,
    }),
    ApiNotFoundResponse({ description: 'Unknown match' }),
    ApiUnauthorizedResponse({ description: 'Invalid token' }),
    ApiForbiddenResponse({ description: 'Forbidden' }),
  )
}

function readFootballDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Read one football match for editing' }),
    ApiParam({ name: 'id', description: 'Match id.' }),
    ApiOkResponse({
      description: 'Draft body the football POST accepts, plus status.',
      standardSchema: editorFootballDraftSchema,
    }),
    ApiNotFoundResponse({ description: 'Unknown match' }),
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

  @Get('matches/tennis/:id')
  @readTennisDocs()
  readTennis(@Param('id') id: string): Promise<EditorTennisDraft> {
    if (!idSchema.safeParse(id).success) throw new NotFoundException('Unknown match')
    return this.readTennisOne(id)
  }

  @Get('matches/football/:id')
  @readFootballDocs()
  readFootball(@Param('id') id: string): Promise<EditorFootballDraft> {
    if (!idSchema.safeParse(id).success) throw new NotFoundException('Unknown match')
    return this.readFootballOne(id)
  }

  private async readTennisOne(id: string): Promise<EditorTennisDraft> {
    const catalog = await this.openCatalog()
    try {
      return await readEditorTennisDraft(catalogDb(catalog), id)
    } catch (error) {
      if (error instanceof CatalogError && error.code === 'unknown-ref') {
        throw new NotFoundException(error.message)
      }
      throw error
    } finally {
      await catalog.close()
    }
  }

  private async readFootballOne(id: string): Promise<EditorFootballDraft> {
    const catalog = await this.openCatalog()
    try {
      return await readEditorFootballDraft(catalogDb(catalog), id)
    } catch (error) {
      if (error instanceof CatalogError && error.code === 'unknown-ref') {
        throw new NotFoundException(error.message)
      }
      throw error
    } finally {
      await catalog.close()
    }
  }

  private async read(query: EditorMatchListQuery): Promise<EditorMatchPage> {
    const catalog = await this.openCatalog()
    try {
      return await listEditorMatches(catalogDb(catalog), query)
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
