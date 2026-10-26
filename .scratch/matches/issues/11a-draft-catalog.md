# 11a: Draft match catalog writes

**What to build:** `saveDraft` stores a tennis match (set score, optional raw stats for both players) or a football match (score, appearances) as `draft`. This is part 1 of plan item 11. The HTTP routes are `.scratch/matches/issues/11b-draft-routes.md` and are not in this pull request.

**Blocked by:** Plan item 5 (PRs #11 and #12) and plan item 10 (PR #20, `.scratch/auth/issues/10-jwt-login.md`).

**Status:** resolved

## Scope

In: `Catalog.saveDraft` for `tennis` and `football`, create and update. The body is checked with `tennisMatchSchema`, `tennisMatchStatsSchema`, `footballMatchSchema`, and `appearanceSchema`. The server sets `status: draft` and `source: manual`, and on create sets `createdBy` to the actor id. An update keeps `createdBy` and clears `reviewedBy` and `publishedAt`. Stats and appearances replace the previous rows. Raw counts only. A percentage field is rejected. A repeated athlete id is rejected. One transaction. No migration: `0005` is the latest, and these rows already fit.

Out: HTTP routes, `EditorGuard`, OpenAPI, and `docs/feature-map.md`. Those are part 2. Also out: studio forms, publish and review, import, and any change under `apps/studio`, `tools/guards`, `AGENTS.md`, or `docs/lessons.md`.

## Order

Plan, then develop. No ADR: the catalog seam and the shared schemas already exist. Pre-launch: the author self-reviews. Daniel squash-merges. That merge is the final gate.

## Acceptance

- [x] A tennis create stores a draft, the set score, and raw stat counts, and the read-back has no percentage field. A 7-6 set without the loser's tiebreak points fails with the shared-schema message. `firstServePct` and a client `status` fail. A stat for someone other than the two players fails and stores nothing. The same athlete listed twice fails with `Each athlete is listed once` and stores nothing.
- [x] A football create stores a draft score and appearances. Zero minutes with a goal fails with the shared-schema message and stores nothing. `createdBy` is the actor id.
- [x] An update of a published tennis or football match returns `status: draft`, clears the reviewer and publish time, replaces stats or appearances, and drops the match from the published list.
- [x] A repeated id fails with `That record is already stored`.

## Verification

`vp run verify:api` needs Docker and only sends GET. This slice has no new route. When Docker is absent, say so. The PGLite suite is the proof for validation, draft status, and replace-on-edit.

## Architect

No. No new dependency, ADR, or shared type. `libs/shared-types` already owns the score and appearance rules. `saveDraft` on the existing catalog writes the match and its detail in one transaction. Apps do not import each other.

### Seams

- `saveDraft` on the seeded PGLite catalog. Catches a score or appearance the shared schema rejects, a percentage or a repeated athlete, a draft that was not stored, and a published row that stays published after an edit.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/22
