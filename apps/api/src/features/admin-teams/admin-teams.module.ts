import { Module } from '@nestjs/common'
import { AdminTeamsController } from '../../admin-teams.controller.js'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [AdminTeamsController],
})
export class AdminTeamsModule {}
