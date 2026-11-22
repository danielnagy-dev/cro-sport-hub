import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { PublishSlotsController } from './publish-slots.controller.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [PublishSlotsController],
})
export class PublishSlotsModule {}
