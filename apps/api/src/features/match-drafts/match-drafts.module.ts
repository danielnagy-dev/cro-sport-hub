import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { MatchDraftsController } from '../../match-drafts.controller.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [MatchDraftsController],
})
export class MatchDraftsModule {}
