# Where to look

Commands are in `AGENTS.md`. Open work and order: `docs/agents/issue-tracker.md` (GitHub Issues; the issue body is the spec; the `## Blocked by` section lists `#N` blockers that must be closed before starting).

Open these paths first.

## API

A feature is a Nest module at `apps/api/src/features/<name>/<name>.module.ts`. `AppModule.register` loads every module in that directory (`apps/api/src/load-feature-modules.ts`, `docs/adr/007-api-feature-files.md`). A new feature adds the folder.

Controllers added with the feature live in that folder (`apps/api/src/features/gallery/`). Older controllers are still `apps/api/src/<name>.controller.ts`. The feature module imports them: `apps/api/src/features/athletes/athletes.module.ts` imports `AthletesController`.

Redis cache for public reads: `apps/api/src/public-read-cache/`. SQL and Drizzle: `apps/api/src/catalog/`. Schemas shared with studio and web: `libs/shared-types/src/<topic>.ts` and one export line in `libs/shared-types/src/index.ts`.

## Studio

A screen is `apps/studio/src/app/feature/<name>/` (component, template, spec). Its routes are `feature/<name>/<name>.routes.ts` (`docs/adr/008-studio-feature-routes.md`). `apps/studio/src/app/app.routes.ts` is the shell: one `loadChildren` per feature, in folder order, and the `**` redirect. A new feature adds that routes file and one shell entry. Do not add a `loadComponent` to the shell, and do not add a routes file before the screen has a path. A feature's HTTP calls are `apps/studio/src/app/core/<name>-api.ts`. `core/studio-http.ts` is the shared request helper. Reads that several screens already share stay on `core/studio-api.ts`. A new screen adds its own client file and does not add a method to `studio-api.ts`. The client spec is `core/studio-api.spec.ts`. Import direction: `.cursor/skills/architect/SKILL.md` (**Studio app**).

The home list is the stub `apps/studio/src/app/core/stub-api.ts`. `/matches` and the score forms call the API.

## Web

Pages are `apps/web/app/`. Data helpers are `apps/web/lib/` (`api-client.ts` calls the API). Tests are `apps/web/tests/`. Shared React components are `libs/ui/src/`.
