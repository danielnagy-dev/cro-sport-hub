import { Module } from "@nestjs/common";
import { readApiConfig } from "./api-config.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { openPostgresCatalog } from "./catalog/catalog.js";
import { CATALOG_OPENER, MatchesController } from "./matches.controller.js";

@Module({
  imports: [],
  controllers: [AppController, MatchesController],
  providers: [
    AppService,
    {
      provide: CATALOG_OPENER,
      useValue: () => openPostgresCatalog(readApiConfig().databaseUrl),
    },
  ],
})
export class AppModule {}
