import {
  applyDecorators,
  ConflictException,
  Controller,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
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
import { CatalogError, type Catalog } from './catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from './matches.controller.js'

const submittedSchema = z.strictObject({
  id: idSchema,
  status: z.literal('review'),
})
const rejectedSchema = z.strictObject({
  id: idSchema,
  status: z.literal('draft'),
})

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
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

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

  private async transition(id: string, action: 'submit' | 'reject') {
    const catalog: Catalog = await this.openCatalog()
    try {
      const saved =
        action === 'submit' ? await catalog.submitMatch(id) : await catalog.rejectMatch(id)
      return (action === 'submit' ? submittedSchema : rejectedSchema).parse(saved)
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }
}
