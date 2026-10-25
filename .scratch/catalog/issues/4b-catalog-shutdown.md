# 4b: Catalog shutdown and typed failures

**What to build:** Follow-ups deferred from plan item 4 (the Drizzle catalog). This note is the spec.

In: a migration failure after a successful `SELECT 1` is a `CatalogError` with code `migration` and message `The catalog migration failed`, not `unreachable` (`Postgres is unreachable`). `Catalog.close()` ends the `pg` pool, and the PGLite instance when the opener owns one. A shared-schema parse failure is a `CatalogError` (`invalid`, `The record does not match the shared schema`) and the Zod error is `cause`.

Out: the Nest process still does not open the catalog on boot. No new route, dependency, or shared schema.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Acceptance: PGLite tests expect those exact errors. After `close()`, a PGLite query fails with `PGlite is closed`.

Verification: the catalog is not an HTTP route. `vp run verify:api` needs Docker. Proof is the PGLite suite.

## Comments

Merged: https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/8
