# af3: Detach catalog writes from `Catalog`

**What to build:** `Catalog` is `write`, `read`, and `close`. Draft save, team replace and delete, submit, reject, and any import or workflow method those pull requests hung on the interface become functions of `CatalogDb`. ADR-007 is the spec.

**Blocked by:** af2 (`.scratch/api-features/issues/02-catalog-reads.md`). The read slice has left `connection.ts` and `errors.ts`.

**Status:** ready-for-agent

**Size:** 340 counted lines. `saveDraft` has the dense call sites. Submit and reject are already on main (#30). `runImport` takes a `Catalog` and is not a method in #35; leave it unless the merged code hung it on the interface. Recount the call sites before editing. If that count would pass 400, split `saveDraft` from the other writes before the first edit.

**Shared files:**

- `apps/api/src/catalog/connection.ts`
- `apps/api/src/catalog/errors.ts`

## Scope

In: the same move as af2, for the remaining methods. Feature-only error codes move into the feature file. The shared `CatalogErrorCode` union is unchanged, including `not-football`.

Out: migration discovery (af4), HTTP path changes, and new product behaviour.

## Order

Plan is this note. Architect is ADR-007. Develop. May run with af6. af4 starts when this has merged. Daniel squash-merges.

## Acceptance

- [ ] Saving a tennis draft and a football draft still returns `{ id, status: "draft", sport }`.
- [ ] Submit, reject, team replace, and team delete still return the same status codes as on main.
- [ ] `Catalog` has `write`, `read`, and `close`, and no other methods.
- [ ] `CatalogErrorCode` has the same members as on main at the start of af2.

## Verification

`vp run verify:api` for `/api/matches`. The draft and admin routes are the PGLite suite; `verify:api` does not send an editor token. Say that in the results table. No feature-map edit.

## Architect

Yes. ADR-007. A new code that only one feature throws is a type in that feature, decided here so develop does not widen the shared union.

### Seams

- `saveDraft(db, sport, body, actorId, mode)` on PGLite. Catches a draft that skips validation because the wrapper used to call `parseRecord`.
- The `Catalog` type. Catches a write method left on the interface.
