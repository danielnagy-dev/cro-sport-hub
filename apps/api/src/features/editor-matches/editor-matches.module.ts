import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { EditorMatchesController } from '../../editor-matches.controller.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [EditorMatchesController],
})
export class EditorMatchesModule {}
