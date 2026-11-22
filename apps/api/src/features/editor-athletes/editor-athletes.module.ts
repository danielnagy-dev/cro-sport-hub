import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { EditorAthletesController } from './editor-athletes.controller.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [EditorAthletesController],
})
export class EditorAthletesModule {}
