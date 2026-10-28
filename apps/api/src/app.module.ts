import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DynamicModule, Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module.js'
import { CatalogModule } from './catalog/catalog.module.js'
import { loadFeatureModules } from './load-feature-modules.js'

@Module({})
export class AppModule {
  static async register(options?: { featuresDirectory?: string }): Promise<DynamicModule> {
    const defaultDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'features')
    const featuresDirectory = options?.featuresDirectory ?? defaultDirectory
    const features = await loadFeatureModules(featuresDirectory)
    return {
      module: AppModule,
      imports: [...features, CatalogModule, AuthModule],
      controllers: [],
    }
  }
}
