# 14a: Import drafts from a fixture

**What to build:** An admin runs one JSON fixture that creates or updates draft matches and records the run. A published row with the same source ref is left alone. This note is the spec.

**Blocked by:** None. `saveDraft` is on main (plan 11a, PR #22) and stays the manual writer. This slice does not grow a second manual path. The `(source, source_ref)` unique key is already on main (plan 5).

**Status:** ready-for-agent

**Size:** 340 counted lines. One migration, one adapter, two admin routes, and the fixture cases. The hourly timer is 14b, not this slice.

## Scope

In: table `import_runs` in a new `0006_v1_import_runs.sql`, one statement, `IF NOT EXISTS`, no `DO` block (the runner splits on semicolons). Columns: `id`, `started_at`, `finished_at`, `created_count`, `updated_count`, `skipped_count`, `error` (empty string when the run finished cleanly). `0001`–`0005` stay byte-for-byte.

`runImport(catalog, fixture)` reads a JSON fixture shipped in the repo. The fixture holds one tennis match and one football match. Names follow the sample style (`Sample Player`, `Sample Club`). `source` is `import` and each row has a `sourceRef`. The writer is the catalog, not `saveDraft` (`saveDraft` forces `source: manual` and would clear a review). New rows are `draft`, `createdBy` is the admin caller. A later run with the same `sourceRef` updates the score or appearances only when the stored row is still `draft`, and the status stays `draft`. A `review` or `published` row with that `sourceRef` counts as skipped and is not modified. A fixture row that fails validation counts as an error on the run, stores nothing for that row, and does not abort the other row.

`POST /api/admin/import` (admin) runs the fixture and returns the run. `GET /api/admin/import/runs` returns runs, newest first. Editor is HTTP 403. Missing token is HTTP 401. OpenAPI marks both with bearer security.

Out: `@nestjs/schedule`, the `IMPORT_SCHEDULE` flag, and any network feed. The timer is 14b. The studio button is 27c. No ADR unless develop finds it cannot store the run without a new dependency; the ticket expects none. Update `docs/feature-map.md` with `api.import`.

## Order

Plan is this note. Architect sketches `runImport` and the run row below; no ADR. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] The first admin run returns created 2, updated 0, skipped 0, and both rows are `draft` with `source: import` and a `sourceRef`. `GET /api/matches` does not list them.
- [ ] The second run, same fixture, returns skipped 2. The ids are unchanged.
- [ ] A changed score on a draft `sourceRef` returns updated 1 and the stored score changes. Status stays `draft`.
- [ ] A published row with that `sourceRef` is skipped. It stays `published` and the score stays.
- [ ] A fixture row the shared schema rejects sets `error` on the run and does not store that row. The other fixture row still stores.
- [ ] An editor token is HTTP 403. `/docs-json` documents both paths.

## Verification

PGLite HTTP suite. `vp run verify:api` does not run the import. Say that in the results table.

## Architect

Yes. New table and a new function. No ADR and no new dependency: the catalog seam and the shared match schemas already exist. `saveDraft` stays the manual path.

`runImport(catalog, fixture, actorId)` returns the run row. The HTTP handler is the admin seam. Studio does not import it.

### Seams

- `runImport` on PGLite. Catches a second insert with the same `sourceRef`, an update that publishes, and a published row whose score moved.
- `POST /api/admin/import` and `GET /api/admin/import/runs`. Catches an editor who can run it, and a run that is missing from the list.
