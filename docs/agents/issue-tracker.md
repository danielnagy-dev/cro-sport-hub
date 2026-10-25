# Issue tracker

No issue tracker. Origin has no issues. Work items are Daniel's plan items.

## Spec

The spec is the plan note, or the PR `## Summary` when the note is not in the branch. `code-review` uses that text as the Spec axis.

## Fetch

Read that note or the PR body. A `#123` in a commit is not an issue id. Do not call `gh` or `glab`. Do not create labels, issues, or comments.

## Local files

Write `.scratch/<feature>/issues/<NN>-<slug>.md` only when Daniel asks.

## Pull requests

PRs live on Cursor Origin. Agents never merge.

## Status

Origin still has no issues. This table is plan-item status, not an issue.

| Plan             | Status                                                                                                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16 match results | PR #5 merged the match card. PR #7 adds the tennis stats view and the appearances table in `libs/ui`. Web does not render `MatchCard`, so both stay in the library. See `ui.results` in `docs/feature-map.md`. |

## Plan items

### 4b — Catalog shutdown and typed failures

Follow-ups deferred from plan item 4 (the Drizzle catalog). This note is the spec.

In: a migration failure after a successful `SELECT 1` is a `CatalogError` with code `migration` and message `The catalog migration failed`, not `unreachable` (`Postgres is unreachable`). `Catalog.close()` ends the `pg` pool, and the PGLite instance when the opener owns one. A shared-schema parse failure is a `CatalogError` (`invalid`, `The record does not match the shared schema`) and the Zod error is `cause`.

Out: the Nest process still does not open the catalog on boot. No new route, dependency, or shared schema.

Acceptance: PGLite tests expect those exact errors. After `close()`, a PGLite query fails with `PGlite is closed`.

Verification: the catalog is not an HTTP route. `vp run verify:api` needs Docker. Proof is the PGLite suite.
