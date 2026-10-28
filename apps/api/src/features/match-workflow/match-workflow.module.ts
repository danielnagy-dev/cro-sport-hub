import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { MatchWorkflowController } from '../../match-workflow.controller.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [MatchWorkflowController],
})
export class MatchWorkflowModule {}
