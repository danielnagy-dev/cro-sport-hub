import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { readApiConfig } from './api-config.js'
import { AppModule } from './app.module.js'
import { loadRootEnv } from './load-root-env.js'
import { setupOpenApi } from './openapi.js'

loadRootEnv()

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(await AppModule.register())
  setupOpenApi(app)
  await app.listen(readApiConfig().port)
}

await bootstrap()
