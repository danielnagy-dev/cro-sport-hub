# api.import: Import drafts from the shipped fixture

| App | Status | Entry point (user POV)   | Verify            | Since         |
| --- | ------ | ------------------------ | ----------------- | ------------- |
| api | live   | `POST /api/admin/import` | `vp run api#test` | plan item 14a |

`POST /api/admin/import` runs the JSON fixture shipped in the repo and returns an import run (`id`, counts, timestamps, and `error` when a row failed validation). `GET /api/admin/import/runs` lists runs, newest first. Both routes are admin only. An admin sends `Authorization: Bearer`. No token is HTTP 401 `Invalid token`. An editor is HTTP 403 `Forbidden`. New rows are `draft` with `source: import` and a `sourceRef`. A later run with the same `sourceRef` updates score or appearances only when the stored row is still `draft`. A `review` or `published` row with that `sourceRef` is skipped and not modified. Imported rows do not appear on `GET /api/matches`.

When `IMPORT_SCHEDULE` is exactly `true`, the API also registers one hourly job on the import module. Each tick calls the same `runImport` path as the POST route, with actor id `admin-demo` and no password. The default interval is once per hour. Unset, empty, or any other value leaves the timer off, including during `vp run api#dev`. Enabling the flag does not import until the first tick.

#### How to get to it (user POV)

- `POST http://localhost:3001/api/admin/import` with an admin bearer token.
- `GET http://localhost:3001/api/admin/import/runs` with an admin bearer token. Shapes are on `GET /docs-json`.

#### Driving it with verify

The verify CLI only sends GET and does not send an admin token, so `vp run verify:api` does not run the import. The PGLite HTTP suite in `apps/api/src/import.controller.spec.ts` covers both routes, the role checks, repeat runs, and `/docs-json`.

#### Gotchas

- Manual saves use `saveDraft`, which forces `source: manual`. Import uses its own writer so review and published rows stay alone.
- A fixture row that fails validation sets `error` on the run and does not store that row. The other fixture row still stores.
