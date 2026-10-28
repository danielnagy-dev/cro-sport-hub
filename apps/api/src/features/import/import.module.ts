import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { ImportController } from '../../import.controller.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [ImportController],
})
export class ImportModule {}
