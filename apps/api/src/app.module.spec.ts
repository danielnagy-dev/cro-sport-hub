import { type AddressInfo } from 'node:net'
import { NestFactory } from '@nestjs/core'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { AppModule } from './app.module.js'
import { AppService } from './app.service.js'
import { type HealthResponse } from './health-response.js'
import { openApiConfig, setupOpenApi } from './openapi.js'

const health: HealthResponse = {
  status: 'ok',
  sharedTypes: '@cro-sport-hub/shared-types',
  slideGenerator: '@cro-sport-hub/slide-generator',
  postgres: 'up',
  redis: 'up',
}

describe('AppModule.register', () => {
  let close: (() => Promise<void>) | undefined

  afterEach(async () => {
    await close?.()
    close = undefined
  })

  it('returns a dynamic module with no controllers', async () => {
    const dynamic = await AppModule.register()
    expect(dynamic.controllers).toEqual([])
    expect(dynamic.imports?.length).toBeGreaterThan(2)
  })

  it('boots every route from the feature folders', async () => {
    const moduleRef = await NestFactory.create(await AppModule.register(), { logger: false })
    moduleRef.get(AppService).getHealth = async () => health
    setupOpenApi(moduleRef)
    await moduleRef.listen(0, '127.0.0.1')
    close = () => moduleRef.close()
    const address = moduleRef.getHttpServer().address() as AddressInfo | null
    if (!address) {
      throw new Error('Expected the test server to be listening')
    }
    const port = address.port

    const healthResponse = await fetch(`http://127.0.0.1:${port}/health`)
    expect(healthResponse.status).toBe(200)

    const docs = await fetch(`http://127.0.0.1:${port}/docs-json`)
    expect(docs.status).toBe(200)
    const document: { tags?: { name: string }[] } = await docs.json()
    const tagNames = document.tags?.map((tag) => tag.name) ?? []
    const configured = openApiConfig().tags?.map((tag) => tag.name) ?? []
    expect(tagNames).toEqual(expect.arrayContaining(configured))
  })
})
