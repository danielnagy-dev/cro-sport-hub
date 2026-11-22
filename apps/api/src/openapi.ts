import { type INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export function openApiConfig() {
  // New features set @ApiTags on the controller. Do not call addTag here.
  return new DocumentBuilder()
    .setTitle('Cro Sport Hub API')
    .setDescription('REST API for tennis and football results. Version 1 uses seed and test data.')
    .setVersion('0.0.0')
    .addTag('health', 'API process and local Postgres and Redis')
    .addTag('matches', 'Published match lists and the editorial list')
    .addTag('athletes', 'Public athlete profiles and club history')
    .addTag('editor', 'Competition, athlete, and club lists for match forms')
    .addBearerAuth()
    .build()
}

export function setupOpenApi(app: INestApplication): void {
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, openApiConfig()))
}
