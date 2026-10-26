# 27c: Import log and Run now

**What to build:** An admin sees import runs and can start the fixture import. Editors do not. This note is the spec.

**Blocked by:** 14a (`.scratch/import/issues/14a-import-fixture.md`) and 27a (`.scratch/studio/issues/27a-competitions-admin.md`).

**Status:** ready-for-agent

**Size:** 240 counted lines. One table and one button on the admin nav. The run logic is 14a.

## Scope

In: `/admin/import`, linked from the admin nav. The table lists runs from `GET /api/admin/import/runs`: when it started, created, updated, skipped, and the error string. Newest first. Run now calls `POST /api/admin/import` and then reloads the list. The new row's counts are visible. An error string from the run is shown in that row. An editor does not see the page.

Out: a timer control, a file upload, and any feed other than the server fixture. The hourly import is 14b. It is the `IMPORT_SCHEDULE` flag, not a control on this page. Extend `studio.admin` in `docs/feature-map.md`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] A stubbed list of one run shows its created, updated, skipped, and error values.
- [ ] Run now sends `POST /api/admin/import` and the table includes the returned run.
- [ ] An editor session does not see the import table or the button.
- [ ] The page does not ask for a file and does not post a cron expression.

## Verification

`vp run studio#test`. Verify without a session lands on login.

## Architect

No. The routes are 14a. The page adds no schema and no timer.

### Seams

- The import page, stubbed HTTP. Catches a Run now that does not refresh, and an editor who sees the button.
