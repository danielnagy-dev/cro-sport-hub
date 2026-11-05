import {
  applyDecorators,
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { idSchema, sportSlugSchema } from '@cro-sport-hub/shared-types'
import { z } from 'zod'
import { EditorAuthGuard } from './auth/role.guard.js'
import { catalogDb, CatalogError, type Catalog } from './catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from './catalog/catalog.module.js'
import { saveDraft } from './catalog/drafts.js'

const draftSavedSchema = z.strictObject({
  id: idSchema,
  status: z.literal('draft'),
  sport: sportSlugSchema,
})

const ID_MESSAGE = 'Expected an id of 1–64 letters, digits, underscores, or hyphens'

type AuthedRequest = { user?: { id: string } }
type DraftSport = 'tennis' | 'football'
type DraftMode = 'create' | 'update'

function draftDocs(summary: string, created: boolean) {
  const saved = { description: 'Saved as a draft.', standardSchema: draftSavedSchema }
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary }),
    created ? ApiCreatedResponse(saved) : ApiOkResponse(saved),
    ApiBadRequestResponse({ description: 'The body does not match the shared schema' }),
    ApiUnauthorizedResponse({ description: 'Invalid token' }),
    ApiForbiddenResponse({ description: 'Forbidden' }),
  )
}

function withId(body: unknown, id: string): unknown {
  if (!idSchema.safeParse(id).success) throw new BadRequestException(ID_MESSAGE)
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { id }
  if ('id' in body && body.id !== id) {
    throw new BadRequestException('The match id is the one in the path')
  }
  return { ...body, id }
}

function catalogCause(error: unknown): unknown {
  if (error instanceof CatalogError) return error
  if (typeof error === 'object' && error !== null && 'cause' in error) {
    const inner = catalogCause(error.cause)
    if (inner instanceof CatalogError) return inner
  }
  return error
}

function toHttp(error: unknown): unknown {
  const cause = catalogCause(error)
  if (!(cause instanceof CatalogError)) return error
  if (cause.code === 'conflict') return new ConflictException(cause.message)
  if (cause.code === 'unknown-ref') return new NotFoundException(cause.message)
  if (cause.code === 'invalid' || cause.code === 'not-football') {
    return new BadRequestException(cause.issues?.[0]?.message ?? cause.message)
  }
  return error
}

@ApiTags('matches')
@UseGuards(EditorAuthGuard)
@Controller('api')
export class MatchDraftsController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Post('matches/tennis')
  @draftDocs('Save a tennis match as a draft', true)
  createTennis(@Body() body: unknown, @Req() request: AuthedRequest) {
    return this.save('tennis', body, request, 'create')
  }

  @Put('matches/tennis/:id')
  @draftDocs('Replace a tennis match and save it as a draft', false)
  @ApiParam({ name: 'id', description: 'Match id.' })
  updateTennis(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthedRequest) {
    return this.save('tennis', withId(body, id), request, 'update')
  }

  @Post('matches/football')
  @draftDocs('Save a football match as a draft', true)
  createFootball(@Body() body: unknown, @Req() request: AuthedRequest) {
    return this.save('football', body, request, 'create')
  }

  @Put('matches/football/:id')
  @draftDocs('Replace a football match and save it as a draft', false)
  @ApiParam({ name: 'id', description: 'Match id.' })
  updateFootball(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthedRequest) {
    return this.save('football', withId(body, id), request, 'update')
  }

  private async save(sport: DraftSport, body: unknown, request: AuthedRequest, mode: DraftMode) {
    const actorId = request.user?.id
    if (actorId === undefined) throw new UnauthorizedException('Invalid token')
    const catalog: Catalog = await this.openCatalog()
    try {
      return draftSavedSchema.parse(await saveDraft(catalogDb(catalog), sport, body, actorId, mode))
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }
}
