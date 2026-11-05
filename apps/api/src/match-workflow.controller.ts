import {
  applyDecorators,
  ConflictException,
  Controller,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
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
import { idSchema } from '@cro-sport-hub/shared-types'
import { z } from 'zod'
import { AdminAuthGuard, EditorAuthGuard } from './auth/role.guard.js'
import { catalogDb, CatalogError, type Catalog } from './catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from './catalog/catalog.module.js'
import { invalidatePublicReads } from './public-read-cache/invalidate-public-reads.js'
import { PUBLIC_READ_CACHE, type PublicReadCacheClient } from './public-read-cache/client.js'
import { publishMatch, rejectMatch, submitMatch } from './catalog/workflow.js'

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

type AuthedRequest = { user?: { id: string } }

function workflowDocs(summary: string, saved: z.ZodType, conflict: string) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary }),
    ApiParam({ name: 'id', description: 'Match id.' }),
    ApiOkResponse({ description: 'The match id and its new status.', standardSchema: saved }),
    ApiUnauthorizedResponse({ description: 'Invalid token' }),
    ApiForbiddenResponse({ description: 'Forbidden' }),
    ApiNotFoundResponse({ description: 'Unknown match' }),
    ApiConflictResponse({ description: conflict }),
  )
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
  return error
}

@ApiTags('matches')
@Controller('api')
export class MatchWorkflowController {
  constructor(
    @Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener,
    @Inject(PUBLIC_READ_CACHE) private readonly cache: PublicReadCacheClient,
  ) {}

  @Post('matches/:id/submit')
  @HttpCode(200) // Nest's default for POST is 201.
  @UseGuards(EditorAuthGuard)
  @workflowDocs('Submit a draft for review', submittedSchema, 'Only a draft can be submitted')
  submit(@Param('id') id: string) {
    return this.transition(id, 'submit')
  }

  @Post('matches/:id/reject')
  @HttpCode(200) // Nest's default for POST is 201.
  @UseGuards(AdminAuthGuard)
  @workflowDocs(
    'Reject a match in review back to draft',
    rejectedSchema,
    'Only a match in review can be rejected',
  )
  reject(@Param('id') id: string) {
    return this.transition(id, 'reject')
  }

  @Post('matches/:id/publish')
  @HttpCode(200) // Nest's default for POST is 201.
  @UseGuards(AdminAuthGuard)
  @workflowDocs(
    'Publish a match in review',
    publishedSchema,
    'Only a match in review can be published',
  )
  publish(@Param('id') id: string, @Req() request: AuthedRequest) {
    const actorId = request.user?.id
    if (actorId === undefined) throw new UnauthorizedException('Invalid token')
    return this.transition(id, 'publish', actorId)
  }

  private async transition(id: string, action: 'submit' | 'reject' | 'publish', actorId?: string) {
    const catalog: Catalog = await this.openCatalog()
    try {
      const db = catalogDb(catalog)
      const saved =
        action === 'submit'
          ? await submitMatch(db, id)
          : action === 'reject'
            ? await rejectMatch(db, id)
            : await publishMatch(db, id, actorId ?? '')
      const parsed = (
        action === 'submit'
          ? submittedSchema
          : action === 'reject'
            ? rejectedSchema
            : publishedSchema
      ).parse(saved)
      if (action === 'publish') await invalidatePublicReads(this.cache)
      return parsed
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }
}
