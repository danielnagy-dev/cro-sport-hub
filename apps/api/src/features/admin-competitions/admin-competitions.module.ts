import { Module } from '@nestjs/common'
import {
  AdminCompetitionsController,
  COMPETITION_OPENER,
} from '../../admin-competitions.controller.js'
import { readApiConfig } from '../../api-config.js'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { openCompetitionSession } from '../../competition-admin.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [AdminCompetitionsController],
  providers: [
    {
      provide: COMPETITION_OPENER,
      useValue: () => openCompetitionSession(readApiConfig().databaseUrl),
    },
  ],
})
export class AdminCompetitionsModule {}
