import { Module } from "@nestjs/common";
import { AdminTeamsController } from "./admin-teams.controller.js";
import { readApiConfig } from "./api-config.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { AthletesController } from "./athletes.controller.js";
import { openCredentialStore } from "./auth/auth.js";
import { CREDENTIAL_STORE, LoginController } from "./auth/login.controller.js";
import { AdminAuthGuard, EditorAuthGuard } from "./auth/role.guard.js";
import { openPostgresCatalog } from "./catalog/catalog.js";
import { MatchDraftsController } from "./match-drafts.controller.js";
import { MatchWorkflowController } from "./match-workflow.controller.js";
import { CATALOG_OPENER, MatchesController } from "./matches.controller.js";

@Module({
  imports: [],
  controllers: [
    AppController,
    MatchesController,
    AthletesController,
    LoginController,
    MatchDraftsController,
    MatchWorkflowController,
    AdminTeamsController,
  ],
  providers: [
    EditorAuthGuard,
    AdminAuthGuard,
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
