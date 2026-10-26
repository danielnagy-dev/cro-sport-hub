# 11b: Draft match routes

**What to build:** Create and update endpoints for the catalog drafts from part 1. `EditorGuard` protects these routes only. This note is the spec for part 2 of plan item 11.

**Blocked by:** Plan item 11a (PR #22, `.scratch/matches/issues/11a-draft-catalog.md`).

**Status:** resolved

## Scope

In: `POST /api/matches/tennis`, `PUT /api/matches/tennis/:id`, `POST /api/matches/football`, and `PUT /api/matches/football/:id`. Each calls `saveDraft` and returns `{ id, status: "draft", sport }`. `EditorAuthGuard` allows editor and admin. A missing or invalid token is HTTP 401. A verified token whose role is not editor or admin is HTTP 403. OpenAPI documents the four routes with bearer security. `GET /api/matches` and `GET /api/matches/{sport}` stay public. `docs/feature-map.md` names both sports.

Out: the catalog write rules (part 1), studio forms, publish and review, import, and any change under `apps/studio`, `tools/guards`, `AGENTS.md`, or `docs/lessons.md`.

## Order

Plan, then develop. No ADR. Pre-launch: the author self-reviews. Daniel squash-merges. That merge is the final gate.

## Acceptance

- [x] No token is HTTP 401 on `POST /api/matches/tennis` and on `PUT /api/matches/football/:id`. A signed token with role `viewer` is HTTP 403. `GET /api/matches` without a token stays HTTP 200.
- [x] An editor token creates a tennis draft (HTTP 201). An admin token creates a football draft (HTTP 201). The body is `{ id, status: "draft", sport }`.
- [x] `/docs-json` lists the four write routes with bearer security and leaves the public reads unsecured.
- [x] `docs/feature-map.md` names `POST/PUT /api/matches/tennis` and `/football`.

## Verification

`vp run verify:api` needs Docker and only sends GET. When Docker is absent, say so. The PGLite HTTP suite is the proof for the role check. Part 1 proves validation, draft status, and replace-on-edit.

## Architect

No. No new dependency, ADR, or shared type. The controller calls `saveDraft`. Apps do not import each other.

### Seams

- `POST` and `PUT` `/api/matches/tennis` and `/api/matches/football` with `EditorGuard`. Catches a missing token (401), a verified role outside editor and admin (403), and a public `GET` that started requiring a token.
- `GET /docs-json`. Catches a write path missing from OpenAPI, or bearer security applied to the public reads.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/24
