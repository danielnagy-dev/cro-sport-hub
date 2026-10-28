# af2: Detach catalog reads from `Catalog`

**What to build:** Published match reads, athlete reads, team lists, the editor lookups from #29, and the editor match list from #33 are functions of `CatalogDb`. `Catalog` no longer has those methods. ADR-007 is the spec.

**Blocked by:** Pull requests #32, #33, #35, and #36, so the read methods those branches add are on main before this slice removes them. #29 has merged; its lookup reads are in this slice. #30 has merged; its submit and reject methods stay for af3. #35 edits `connection.ts`.

**Status:** in-progress

**Size:** 260 counted lines. The read methods and their call sites. Writes stay for af3. Recount before editing and split one read (matches, athletes, teams, editor) off before the first edit if the count would pass 400.

**Shared files:**

- `apps/api/src/catalog/connection.ts`
- `apps/api/src/catalog/errors.ts`

## Scope

In: move each read method off the `Catalog` interface and off the object `openCatalog` returns. Callers use the function that already performs the query (`listPublishedMatches` and the siblings). `readParsed` moves onto those functions so a Zod failure is still a catalog error. The HTTP bodies stay the same.

Out: `saveDraft`, team replace and delete, submit, reject, publish, import, and any new error code. The migration filename list stays until af4. `write`, `read`, and `close` stay.

## Order

Plan is this note. Architect is ADR-007. Develop. This slice may run with af1 and af5. af3 starts when it has merged. Daniel squash-merges.

## Acceptance

- [ ] `GET /api/matches`, `GET /api/athletes/{slug}`, and the team and editor reads that are on main return the same bodies as before.
- [ ] A type error fires if a caller uses `catalog.listPublishedMatches` or the other detached reads.
- [ ] `catalog.write`, `catalog.read`, and `catalog.close` still typecheck.

## Verification

`vp run verify:api` for `/api/matches` and `/api/athletes?sport=tennis`. Ids `api.matches`, `api.athletes`, and `api.admin-teams` stay as they are. No feature-map edit.

## Architect

Yes. The function signatures are the ones ADR-007 sketches. `CatalogDb` stays in `apps/api`. Studio and web do not import it.

### Seams

- `listPublishedMatches(db, query)` and the athlete read functions on PGLite. Catches a page whose order or names changed because the method wrapper was doing real work.
- The `Catalog` type. Catches a read method left on the interface.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/40
