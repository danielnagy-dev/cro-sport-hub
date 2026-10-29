# af4: Collect migrations from the directory

**What to build:** The catalog applies every `*.sql` file beside the runner, in sorted name order. A new migration is a new file. ADR-007 is the spec.

**Blocked by:** af3 (`.scratch/api-features/issues/03-catalog-writes.md`), which is the last slice editing `connection.ts` for the catalog object. #35 adds `0006_v1_import_runs.sql` and is on main by then, because af2 waits for #35.

**Status:** claimed

**Size:** 160 counted lines. Replace the filename array and cover order with a test.

**Shared files:**

- `apps/api/src/catalog/connection.ts`

## Scope

In: `readdir` of the SQL files, `localeCompare("en")`, and the same split-on-semicolon execution. The statements inside each file stay byte-for-byte.

Out: a new migration, a change to `0001`–`0006` (or whichever files are on main), and `drizzle-kit`.

## Order

Plan is this note. Architect is ADR-007. Develop. May run with af6. Daniel squash-merges.

## Acceptance

- [ ] A fresh PGLite catalog still has the tables the current files create, and the files run in name order.
- [ ] Adding a fixture `*.sql` in a temporary directory is applied without editing the runner.
- [ ] A non-SQL file in that directory is ignored.

## Verification

`vp run verify:api` for `/health`, which opens Postgres and runs migrations. Id `api.health`. No feature-map edit.

## Architect

Yes. ADR-007. The runner stays in `apps/api`. No new dependency.

### Seams

- The migration loader on a temporary directory. Catches a locale-sensitive sort and a spec or text file executed as SQL.
- `openCatalog` on PGLite. Catches a dropped `0004` index or a `0005` credential column because the array used to name them.
