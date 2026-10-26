import { type INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function openApiConfig() {
  return new DocumentBuilder()
    .setTitle("Cro Sport Hub API")
    .setDescription("REST API for tennis and football results. Version 1 uses seed and test data.")
    .setVersion("0.0.0")
    .addTag("health", "API process and local Postgres and Redis")
    .addTag("matches", "Published match lists and draft saves")
    .addBearerAuth()
    .build();
}

export function setupOpenApi(app: INestApplication): void {
  SwaggerModule.setup("docs", app, () => SwaggerModule.createDocument(app, openApiConfig()));
}
