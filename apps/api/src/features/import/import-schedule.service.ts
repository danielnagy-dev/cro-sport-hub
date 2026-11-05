import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { readImportFixture, runImport } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'

@Injectable()
export class ImportScheduleService {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  /** One fixture import as the demo admin. The hourly job and tests call this directly. */
  async tick(): Promise<void> {
    const catalog = await this.openCatalog()
    try {
      await runImport(catalog, readImportFixture(), 'admin-demo')
    } finally {
      await catalog.close()
    }
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'import-hourly' })
  onHourlyImport(): Promise<void> {
    return this.tick()
  }
}
