# ADR-007: API features are new files

## Status

Accepted

## Context

An API feature is registered by appending to the same files: `apps/api/src/app.module.ts` (controllers and providers), `apps/api/src/openapi.ts` (tags), `apps/api/src/catalog/connection.ts` (the migration list and the methods on the object `openCatalog` returns), `apps/api/src/catalog/errors.ts` (the `Catalog` interface and `CatalogErrorCode`), `libs/shared-types/src/index.ts` (the barrel), and `docs/feature-map/api.md` (the index and the prose). Pull requests #32 and #33 append to that set. #29, #30, and #31 did too before they merged. 14a is open as #35 and #36 and appends to the same set. After every merge the next branch conflicted. The plan index had started those tickets together without comparing the paths.

`apps/api` is built by the Nest CLI (ADR-001), so a Vite glob import is not available. ADR-005 and ADR-006 are reserved by plan items 14b and 30e. This decision is 007. It touches `apps/api`, `libs/shared-types`, and `docs/feature-map/`. Studio, web, and `libs/ui` do not import the API.

The `Catalog` methods added since ADR-002 (`listPublishedMatches`, the athlete reads, `saveDraft`, the team writes) call functions that already live in their own files. The three public reads also pass the result through `readParsed`, which turns a Zod failure into a catalog error. That parse stays on the function when the method is removed. The interface is the file every feature edits.

## Decision

A new API feature adds files. The one existing path it may edit is `libs/shared-types/src/index.ts`, and only when it adds a schema or type that other packages import: one export line, kept in alphabetical order. A feature with no new shared export edits no existing file.

### Feature modules, collected at boot

Each feature is a Nest module at `apps/api/src/features/<name>/<name>.module.ts`. The controller, the catalog functions, and any feature-only error type live in that folder. A controller that already exists may stay at its current path; the module imports it. New controllers are created in the folder. Moving an old file counts as a full rewrite under the size gate, so a tidy move waits for a slice that is already changing that file.

`loadFeatureModules(directory)` reads the subdirectories, sorts the names with `localeCompare("en")`, and dynamic-imports each `*.module.ts` (or the compiled `*.module.js`). It skips `*.spec.ts` and `*.spec.js`. `AppModule.register()` returns a dynamic module whose `imports` are that list plus `CatalogModule` and `AuthModule`. `CatalogModule` provides and exports `CATALOG_OPENER`. `AuthModule` provides and exports the guards and the credential store. Feature modules import those two. They do not import `AppModule`. `main.ts` boots `AppModule.register()`. Tests that build the app use the same function.

The interface a feature author learns is the folder name and the two imported modules. The loader hides discovery, sort order, and the source-versus-dist suffix. Studio, web, and `libs/ui` do not import it.

`openApiConfig` keeps the title, the description, the version, bearer auth, and the tags that already exist. A new feature sets `@ApiTags` on its controller and does not call `addTag`.

### Catalog

`Catalog` goes back to the ADR-002 surface: `write`, `read`, and `close`. Feature behaviour is a function of `CatalogDb` in the feature folder, for example `listPublishedMatches(db, query)`. Callers and tests use that function. The shared `CatalogErrorCode` union stays the codes more than one feature already throws (`invalid`, `not-football`, `unknown-ref`, `conflict`, `unreachable`, `migration`). A code only one feature throws is a type in that feature's file. `not-football` stays shared: `records.ts`, team writes, and the controllers all branch on it.

The migration runner reads `*.sql` beside itself and sorts the names. `0001` through the latest file stay in that order because the names already sort that way. A new migration is a new file. The runner still splits a file on semicolons.

### Docs

One file per feature id: `docs/feature-map/<area>/<id>.md` (API ids under `docs/feature-map/api/`). The id is `<area>.<slug>`. The area file holds no index table and no id list. `docs/feature-map.md` keeps the four area rows. The verify skill reads the id file.

### What was rejected

**A sorted line in each shared file.** `AppModule`, `openApiConfig`, the barrel, and the feature-map table would each gain one alphabetically sorted line. Two names that sort beside each other still conflict, and every API ticket would still list the same paths, so the plan rule would keep API work in a single queue. Sort order is kept for the one barrel line. It is not the design.

**`.gitattributes` with `merge=union`.** Union concatenates both sides. On a TypeScript module that duplicates imports and can leave an array that does not parse. On the markdown index it duplicates the header and interleaves rows. It does not sort. A merge driver in `.gitattributes` is local; it is the wrong place to repair a file both sides edited at the same spot. The migration list is the one append-only list of names, and the directory read removes it, so union has nothing to own. This repo does not add a `merge=union` attribute.

**A barrel wildcard, or `pack.exports: { all: true }`.** `libs/shared-types` builds with `vp pack` and `exports: true`, which rewrites `package.json` from the entry points. A hand-written `"./*"` wildcard is overwritten on the next pack, or `package.json` becomes the file every new schema edits. Callers already import `@cro-sport-hub/shared-types`. The barrel line is the remaining edit.

**`import.meta.glob`.** The API build is the Nest CLI, not Vite (ADR-001).

## Consequences

Two API features may run together when neither adds a shared export and neither edits an existing feature file. Two features that both add a line to `libs/shared-types/src/index.ts` are not parallel-safe: alphabetical order and a trailing comma keep the previous line stable, and they do not merge two inserts at the same place.

Open work is a GitHub issue (`docs/agents/issue-tracker.md`). The plan skill records shared files in each issue's Notes. No new runtime dependency.
