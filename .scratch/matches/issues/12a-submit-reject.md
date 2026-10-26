# 12a: Submit a draft and reject a review

**What to build:** An editor or an admin submits a draft to review. An admin rejects a review back to draft. Publish waits. This note is the spec.

**Blocked by:** None. Plan item 11b is on main (PR #24): the draft routes and `EditorGuard` on them. `EditorGuard` and `AdminGuard` have been on main since plan 10.

**Status:** resolved

**Size:** 320 counted lines. Plan 11b was about 410 lines for four write routes and the guard matrix. This is two transitions and that same matrix.

## Scope

In: `POST /api/matches/:id/submit` and `POST /api/matches/:id/reject`. Submit allows editor and admin. The row must be `draft`. It becomes `review` and does not set `reviewedBy` or `publishedAt`. Reject allows admin only. The row must be `review`. It becomes `draft` and clears `reviewedBy` and `publishedAt`. A missing token is HTTP 401 `Invalid token`. An editor calling reject is HTTP 403 `Forbidden`. Any other status is HTTP 409. Submit's message is `Only a draft can be submitted`. Reject's message is `Only a match in review can be rejected`. An unknown id is HTTP 404 `Unknown match`. The body is `{ id, status }`. OpenAPI marks both with bearer security. `GET /api/matches` stays public.

Out: publish, `publishedAt`, and Redis (12b). No cache call in this slice. No studio screen. No new dependency and no ADR. The SQL checks in `0002_v1_matches.sql` already match these states; do not edit `0001`–`0005`. Update `docs/feature-map.md` with `api.match-workflow` covering submit and reject. Publish is added by 12b.

Role rule, taken from the seed and the two guards: the seeded published rows use `admin-demo` as `reviewedBy`. Submit is the editor guard. Reject is the admin guard. There is no rule that the author and the reviewer are different people.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [x] An editor token submits the seeded draft quarterfinal. The row is `review`, and `reviewedBy` and `publishedAt` are empty. The body is `{ id, status: "review" }`.
- [x] An admin token rejects that row back to `draft` and both reviewer fields are empty.
- [x] Submit of a review or a published row is HTTP 409 `Only a draft can be submitted`. Reject of a draft or a published row is HTTP 409 `Only a match in review can be rejected`.
- [x] Reject with an editor token is HTTP 403 `Forbidden`. Submit and reject with no token are HTTP 401 `Invalid token`.
- [x] An unknown id is HTTP 404 `Unknown match`.
- [x] `/docs-json` lists both paths as bearer-secured. `GET /api/matches` stays unsecured.

## Verification

The verify CLI only sends GET, so the transitions are the PGLite HTTP suite. `vp run verify:api --route /api/matches` checks the public list still needs no token. Docker absence follows the 8a note.

## Architect

No. `statusSchema` and the `0002` checks already name the states. The guards are plan 10. This slice only attaches them.

### Seams

- `POST /api/matches/:id/submit` and `POST /api/matches/:id/reject` on PGLite. Catches a publish sneaking into this slice, a reviewer left on a rejected draft, and an editor who can reject.
- `GET /docs-json`. Catches a transition path with no bearer scheme.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/30
