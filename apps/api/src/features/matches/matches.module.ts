import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { MatchesController } from '../../matches.controller.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [MatchesController],
})
export class MatchesModule {}
