import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = module.get(AppController);
  });

  it("returns health and the wired workspace packages", () => {
    expect(appController.getHealth()).toEqual({
      status: "ok",
      sharedTypes: "@cro-sport-hub/shared-types",
      slideGenerator: "@cro-sport-hub/slide-generator",
    });
  });
});
