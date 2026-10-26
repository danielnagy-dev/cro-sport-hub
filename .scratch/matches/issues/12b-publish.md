# 12b: Publish a review and drop the public cache

**What to build:** An admin publishes a match in review. The public Redis keys from 9b are deleted on that publish, and whenever `saveDraft` writes. This note is the spec.

**Blocked by:** 12a (`.scratch/matches/issues/12a-submit-reject.md`) and 9b (`.scratch/cache/issues/9b-athlete-cache.md`). `saveDraft` is on main (plan 11a, PR #22).

**Status:** ready-for-agent

**Size:** 220 counted lines. One route, the same guard tests as 12a, and two call sites for the hook that 9b already tested.

## Scope

In: `POST /api/matches/:id/publish` for admin only. The row must be `review`. It becomes `published`, `reviewedBy` is the caller id, and `publishedAt` is the current time as an ISO-8601 timestamp with a numeric offset (the catalog already round-trips `+02:00`). The response is `{ id, status: "published" }`. Editor is HTTP 403 `Forbidden`. A missing token is HTTP 401 `Invalid token`. A draft or a published row is HTTP 409 `Only a match in review can be published`. Unknown id is HTTP 404 `Unknown match`.

After a successful publish, call `invalidatePublicReads`. `saveDraft` calls it on every successful write, including a write that turns a published row back into a draft. A hook error does not change the HTTP status of a transition that already committed.

Out: the studio review screen (26a). No new dependency and no ADR. Do not edit `0001`–`0005`. Extend `api.match-workflow` in `docs/feature-map.md`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] An admin publishes a row in review. `reviewedBy` is that admin, `publishedAt` parses as a timestamp with an offset, and the next uncached `GET /api/matches` includes the row.
- [ ] An editor token is HTTP 403. A draft id is HTTP 409 `Only a match in review can be published`.
- [ ] The publish test starts with a warm match key and a warm athlete key. After publish both miss.
- [ ] `saveDraft` on a published seeded match leaves it `draft` (plan 11a) and the warm public keys miss afterwards.

## Verification

PGLite HTTP suite for the role and the cache fake. `vp run verify:api` does not publish. Say that in the results table.

## Architect

No. The published-row rule is already in `matchSchema` and `0002`. The hook is 9b.

### Seams

- `POST /api/matches/:id/publish`. Catches an editor who publishes, a draft that publishes, and a public key that survives.
- `saveDraft` on a published id, then a public read through the wrapper. Catches a demoted match that Redis still serves.
