import { Module } from "@nestjs/common";
import { readApiConfig } from "./api-config.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { AthletesController } from "./athletes.controller.js";
import { openCredentialStore } from "./auth/auth.js";
import { CREDENTIAL_STORE, LoginController } from "./auth/login.controller.js";
import { EditorAuthGuard } from "./auth/role.guard.js";
import { openPostgresCatalog } from "./catalog/catalog.js";
import { MatchDraftsController } from "./match-drafts.controller.js";
import { CATALOG_OPENER, MatchesController } from "./matches.controller.js";

@Module({
  imports: [],
  controllers: [
    AppController,
    MatchesController,
    AthletesController,
    LoginController,
    MatchDraftsController,
  ],
  providers: [
    EditorAuthGuard,
    AppService,
    {
      provide: CATALOG_OPENER,
      useValue: () => openPostgresCatalog(readApiConfig().databaseUrl),
    },
    {
      provide: CREDENTIAL_STORE,
      useValue: () => openCredentialStore(readApiConfig().databaseUrl),
    },
  ],
})
export class AppModule {}
