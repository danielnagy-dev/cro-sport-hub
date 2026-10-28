import { Module } from '@nestjs/common'
import { readApiConfig } from '../api-config.js'
import { openPostgresCatalog, type Catalog } from './catalog.js'

export type CatalogOpener = () => Promise<Catalog>

/** Opens a catalog for one request. The Nest process does not connect on boot. */
export const CATALOG_OPENER = Symbol('CATALOG_OPENER')

@Module({
  providers: [
    {
      provide: CATALOG_OPENER,
      useValue: (): Promise<Catalog> => openPostgresCatalog(readApiConfig().databaseUrl),
    },
  ],
  exports: [CATALOG_OPENER],
})
export class CatalogModule {}
