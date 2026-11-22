import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { SlidePreviewController } from './slide-preview.controller.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [SlidePreviewController],
})
export class SlidePreviewModule {}
