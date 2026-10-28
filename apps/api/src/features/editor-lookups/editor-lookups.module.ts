import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { EditorLookupsController } from '../../editor-lookups.controller.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [EditorLookupsController],
})
export class EditorLookupsModule {}
