import { Module } from '@nestjs/common'
import { AthletesController } from '../../athletes.controller.js'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [AthletesController],
})
export class AthletesModule {}
