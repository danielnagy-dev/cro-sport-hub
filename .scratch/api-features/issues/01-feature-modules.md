# af1: Load API feature modules

**What to build:** The API boots from feature modules discovered on disk. Adding a later feature adds a folder and does not edit `AppModule`. ADR-007 is the spec.

**Blocked by:** Pull requests #32, #33, #35, and #36. #32, #33, and #36 still register controllers in `app.module.ts`. #35 and #36 are plan item 14a. #29 and #30 have merged.

**Status:** ready-for-agent

**Size:** 340 counted lines. One loader, two small modules (`CatalogModule`, `AuthModule`), and a module file of about a dozen lines for each controller on main when this starts (the controllers those pull requests add, plus 14a). Recount before editing. Split off half the module files before the first edit if the count would pass 400.

**Shared files:**

- `apps/api/src/app.module.ts`
- `apps/api/src/main.ts`
- `apps/api/src/openapi.ts`
- `docs/adr/007-api-feature-files.md`

## Scope

In: `loadFeatureModules` as ADR-007 specifies, `AppModule.register()`, and a `<name>.module.ts` for every controller on main. Existing controller files stay where they are. `CatalogModule` and `AuthModule` own the opener, the guards, and the credential store, and they export them. Feature modules import those two. `openApiConfig` keeps its current tags and gains a comment that a new feature uses `@ApiTags` and does not call `addTag`.

Out: catalog methods, migration discovery, feature-map files, and moving controller source into the new folders. af2 and af4 cover the catalog. af5 covers the docs.

## Order

Plan is this note. Architect is ADR-007. Develop follows that sketch. This slice may run with af2 and af5. Daniel squash-merges.

## Acceptance

- [ ] `AppModule.register()` exposes every route that was on main, including the ones #32, #33, #35, and #36 added.
- [ ] `GET /docs-json` still lists the existing tags.
- [ ] A fixture module dropped in a temporary features directory is returned, and two fixture names come back in `en` sort order.
- [ ] The controllers array on the dynamic module is empty. Registration of a feature is the folder.
- [ ] ADR-007 status is Accepted. Later slices leave that line alone.

## Verification

`vp run verify:api` for `/health`, `/docs-json`, and `/api/matches`. Ids `api.health`, `api.openapi`, and `api.matches` stay as they are. No feature-map edit: no new route.

## Architect

Yes. ADR-007 is the sketch. Develop does not reopen the loader, the two exported modules, or the decision to leave old controller paths in place.

### Seams

- `loadFeatureModules` on a temporary directory. Catches a spec file being treated as a module, and a sort that follows the machine locale.
- `GET /health` and `GET /docs-json` on the booted app. Catches a controller the loader skipped.
