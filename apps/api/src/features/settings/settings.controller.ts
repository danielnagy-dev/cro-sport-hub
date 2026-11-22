import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Patch,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { z } from 'zod'
import { EditorAuthGuard } from '../../auth/role.guard.js'
import { catalogDb, CatalogError, type Catalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import {
  connectedAccountSchema,
  listConnectedAccounts,
  listPublishSlotClocks,
  publishSlotClockSchema,
  updatePublishSlotClocks,
} from './settings.js'

const clocksResponseSchema = z.array(publishSlotClockSchema)
const accountsResponseSchema = z.array(connectedAccountSchema)

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
  if (cause.code === 'unknown-ref') return new NotFoundException(cause.message)
  if (cause.code === 'invalid') {
    return new BadRequestException(cause.issues?.[0]?.message ?? cause.message)
  }
  return error
}

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(EditorAuthGuard)
@Controller('api/settings')
export class SettingsController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Get('publish-slot-clocks')
  @ApiOperation({ summary: 'List publish slot clock times from settings.' })
  @ApiOkResponse({ description: 'Clocks by sort order.', standardSchema: clocksResponseSchema })
  @ApiUnauthorizedResponse({ description: 'Invalid token' })
  listClocks() {
    return this.run((catalog) => listPublishSlotClocks(catalogDb(catalog)))
  }

  @Patch('publish-slot-clocks')
  @ApiOperation({ summary: 'Update publish slot clock times, order, and active flags.' })
  @ApiOkResponse({ description: 'Clocks after update.', standardSchema: clocksResponseSchema })
  @ApiUnauthorizedResponse({ description: 'Invalid token' })
  patchClocks(@Body() body: unknown) {
    return this.run((catalog) => updatePublishSlotClocks(catalogDb(catalog), body))
  }

  @Get('connected-accounts')
  @ApiOperation({ summary: 'List connected social-account stubs.' })
  @ApiOkResponse({
    description: 'Instagram, Facebook, and X placeholders.',
    standardSchema: accountsResponseSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid token' })
  listAccounts() {
    return listConnectedAccounts()
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
