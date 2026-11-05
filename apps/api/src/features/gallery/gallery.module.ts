import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { GalleryController } from './gallery.controller.js'
@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [GalleryController],
})
export class GalleryModule {}
