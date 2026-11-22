import { Module } from '@nestjs/common'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { PublicEditorialController } from './public-editorial.controller.js'

@Module({
  imports: [CatalogModule],
  controllers: [PublicEditorialController],
})
export class PublicEditorialModule {}
