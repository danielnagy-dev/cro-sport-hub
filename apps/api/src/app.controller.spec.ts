import { type AddressInfo } from "node:net";
import { Test } from "@nestjs/testing";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { type HealthResponse } from "./health-response.js";
import { setupOpenApi } from "./openapi.js";

const up: HealthResponse = {
  status: "ok",
  sharedTypes: "@cro-sport-hub/shared-types",
  slideGenerator: "@cro-sport-hub/slide-generator",
  postgres: "up",
  redis: "up",
};

const down: HealthResponse = {
  status: "error",
  sharedTypes: "@cro-sport-hub/shared-types",
  slideGenerator: "@cro-sport-hub/slide-generator",
  postgres: "up",
  redis: "down",
};

describe("AppController", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  async function start(health: HealthResponse): Promise<number> {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: { getHealth: async () => health } }],
    }).compile();
    const app = moduleRef.createNestApplication();
    setupOpenApi(app);
    await app.listen(0, "127.0.0.1");
    close = () => app.close();
    const address = app.getHttpServer().address() as AddressInfo | null;
    if (!address) {
      throw new Error("Expected the test server to be listening");
    }
    return address.port;
  }

  it("returns 200 and the OpenAPI document when dependencies are up", async () => {
    const port = await start(up);
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toEqual(up);

    const docs = await fetch(`http://127.0.0.1:${port}/docs-json`);
    expect(docs.status).toBe(200);
    const document: unknown = await docs.json();
    expect(document).toMatchObject({
      info: { title: "Cro Sport Hub API", version: "0.0.0" },
      paths: { "/health": { get: { responses: { "200": {}, "503": {} } } } },
    });
  });

  it("returns 503 when a dependency is down", async () => {
    const port = await start(down);
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    expect(health.status).toBe(503);
    await expect(health.json()).resolves.toEqual(down);
  });
});
