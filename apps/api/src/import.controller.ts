import {
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { AdminAuthGuard } from './auth/role.guard.js'
import { listImportRuns, readImportFixture, runImport, type Catalog } from './catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from './matches.controller.js'

type AuthedRequest = { user?: { id: string } }

@ApiTags('import')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Invalid token' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@UseGuards(AdminAuthGuard)
@Controller('api')
export class ImportController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Post('admin/import')
  @ApiOperation({ summary: 'Import drafts from the shipped fixture' })
  @ApiCreatedResponse({ description: 'The import run.' })
  run(@Req() request: AuthedRequest) {
    return this.withCatalog(request, (catalog, actorId) =>
      runImport(catalog, readImportFixture(), actorId),
    )
  }

  @Get('admin/import/runs')
  @ApiOperation({ summary: 'List import runs, newest first' })
  @ApiOkResponse({ description: 'Import runs, newest first.' })
  runs(@Req() request: AuthedRequest) {
    return this.withCatalog(request, (catalog) => listImportRuns(catalog))
  }

  private async withCatalog<T>(
    request: AuthedRequest,
    work: (catalog: Catalog, actorId: string) => Promise<T>,
  ): Promise<T> {
    const actorId = request.user?.id
    if (actorId === undefined) throw new UnauthorizedException('Invalid token')
    const catalog = await this.openCatalog()
    try {
      return await work(catalog, actorId)
    } finally {
      await catalog.close()
    }
  }
}
