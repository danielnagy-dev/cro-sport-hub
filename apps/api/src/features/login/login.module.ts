import { Module } from '@nestjs/common'
import { LoginController } from '../../auth/login.controller.js'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [LoginController],
})
export class LoginModule {}
