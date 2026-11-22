# api.import: Import drafts from the shipped fixture

| App | Status  | Entry point (user POV)   | Verify            | Since         |
| --- | ------- | ------------------------ | ----------------- | ------------- |
| api | retired | `POST /api/admin/import` | `vp run api#test` | plan item 14a |

**Retired (Phase H / #267).** Import Nest controller, controller specs, schedule service, and feature module (`features/import/`) are deleted. Folder auto-load no longer registers an ImportModule, so `POST /api/admin/import` and `GET /api/admin/import/runs` are gone. OpenAPI no longer documents live `import` or `admin` tags. Catalog `runImport` / fixture helpers remain for later bot draft work (Phase J) and #186. Studio import UI is already retired (`studio.admin`).

Historical behaviour: `POST /api/admin/import` ran the JSON fixture shipped in the repo and returned an import run (`id`, counts, timestamps, and `error` when a row failed validation). `GET /api/admin/import/runs` listed runs, newest first. Both routes were admin only. An admin sent `Authorization: Bearer`. No token was HTTP 401 `Invalid token`. An editor was HTTP 403 `Forbidden`. New rows were `draft` with `source: import` and a `sourceRef`. A later run with the same `sourceRef` updated score or appearances only when the stored row was still `draft`. A `review` or `published` row with that `sourceRef` was skipped and not modified. Imported rows did not appear on `GET /api/matches`.

When `IMPORT_SCHEDULE` was exactly `true`, the API also registered one hourly job on the import module. Each tick called the same `runImport` path as the POST route, with actor id `admin-demo` and no password. The default interval was once per hour. Unset, empty, or any other value left the timer off, including during `vp run api#dev`. Enabling the flag did not import until the first tick.

#### How to get to it (user POV)

HTTP routes and the import feature module are retired. Former routes (for history):

- `POST http://localhost:3001/api/admin/import` with an admin bearer token.
- `GET http://localhost:3001/api/admin/import/runs` with an admin bearer token.

Shapes on `GET /docs-json` no longer include an `import` tag. Swagger UI is `/docs`.

#### Driving it with verify

- **OpenAPI.** `vp run verify:api` saves `openapi.json`. Import and admin paths must be absent.
- **Behaviour.** Controller, PGLite HTTP suite, and schedule service are gone (#267). Remaining API tests must pass without `apps/api/src/features/import/` or `import.controller.ts`. Catalog `import.spec.ts` still covers `runImport` helpers.

#### Gotchas

- Manual saves used `saveDraft`, which forced `source: manual`. Import used its own writer so review and published rows stayed alone.
- A fixture row that failed validation set `error` on the run and did not store that row. The other fixture row still stored.
- Hourly import as a future bot draft seam is Phase J — not rebuilt here.
