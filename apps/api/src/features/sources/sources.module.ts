import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { SourcesController } from './sources.controller.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [SourcesController],
})
export class SourcesModule {}
