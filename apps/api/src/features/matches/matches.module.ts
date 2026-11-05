import { Module } from '@nestjs/common'
import { readApiConfig } from '../../api-config.js'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { MatchesController } from '../../matches.controller.js'
import {
  createRedisPublicReadCacheClient,
  PUBLIC_READ_CACHE,
} from '../../public-read-cache/client.js'

@Module({
  imports: [CatalogModule, AuthModule],
  controllers: [MatchesController],
  providers: [
    {
      provide: PUBLIC_READ_CACHE,
      useFactory: () => createRedisPublicReadCacheClient(readApiConfig().redisUrl),
    },
  ],
})
export class MatchesModule {}
