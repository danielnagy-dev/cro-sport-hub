# 9b: Cache athlete reads and the invalidation hook

**What to build:** The athlete routes use the same Redis wrapper. `invalidatePublicReads` deletes every `pub:v1:` key so a later publish can drop the public pages. This note is the spec.

**Blocked by:** 9a (`.scratch/cache/issues/9a-match-cache.md`), 8b, and 8c. The hook has to cover the tennis and football bodies.

**Status:** ready-for-agent

**Size:** 240 counted lines. The 9a wrapper reused on two routes, plus one delete-by-prefix function and its tests.

## Scope

In: cache `GET /api/athletes/:slug` and `GET /api/athletes?sport=` with keys `pub:v1:athletes:<slug>` and `pub:v1:athletes:list:<sport>`. Same 60 second TTL. Same fail-open rule as 9a. `invalidatePublicReads` removes every key that starts with `pub:v1:`, including match keys from 9a. It does not remove unrelated keys. A Redis error from the hook is logged and does not fail the caller; the caller is 12b, which is not in this slice. This slice only proves the hook against the fake.

Out: calling the hook from publish or from `saveDraft` (12b). No new dependency and no ADR. Extend the `api.athletes` gotcha with the same 60 second note.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] A second `GET /api/athletes/sample-player-a` does not hit the catalog. A second sport list does not either.
- [ ] After `invalidatePublicReads`, the next athlete read and the next match read both miss.
- [ ] A key that does not start with `pub:v1:` is still there after the hook.
- [ ] A fake that throws on delete does not throw out of the hook.

## Verification

Unit tests against the fake. `vp run verify:api` when Docker is up, for the athlete route. The hook is not an HTTP route.

## Architect

No. Same wrapper as 9a. The hook is a function in `apps/api` that 12b will call. Studio and web do not import it.

### Seams

- The athlete wrapper. Catches a hit that queries, and a slug key shared with a different athlete.
- `invalidatePublicReads`. Catches a match key that survives, and a non-public key that is deleted.
