# 25c: Reopen a football draft

**What to build:** An editor can open a saved football draft, including appearances, and save it again with `PUT`. The matches table links football rows here. This note is the spec.

**Blocked by:** 25b (`.scratch/studio/issues/25b-football-appearances-form.md`) and 24d (`.scratch/studio/issues/24d-tennis-edit.md`). The tennis edit is the pattern. Appearances have to be on the form this route fills.

**Status:** ready-for-agent

**Size:** 260 counted lines. The 24d GET, on the football draft body, plus the 25b form bound to it.

## Scope

In: `GET /api/editor/matches/football/:id`, editor or admin. The body matches what `POST /api/matches/football` accepts, including `appearances` when they are stored, plus `status`. A tennis id is HTTP 404 `Unknown match`. Missing token is HTTP 401. OpenAPI marks the path with bearer security.

Studio route `/matches/:id/football` loads that GET into the 25b form and saves with `PUT /api/matches/football/:id`. The matches table links a football row here. Unknown id shows `Match not found`.

Out: any new appearance rule. Update `studio.football-form` in `docs/feature-map.md`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] `GET /api/editor/matches/football/match-sample-league` returns the seeded clubs, the 2-1 score, Karlo Brkić's appearance, and `status: published`.
- [ ] A tennis id on that path is HTTP 404 `Unknown match`.
- [ ] The edit form save sends `PUT` with the appearances and without `status`.
- [ ] A football row in the matches table links to that route.

## Verification

PGLite HTTP suite for the GET. `vp run studio#test` for the form. Verify has no bearer. Say that.

## Architect

No. Same read pattern as 24d. The football body is plan 11.

### Seams

- `GET /api/editor/matches/football/:id`. Catches a tennis id that returns a score, and an appearance dropped from a stored draft.
- The edit form, stubbed HTTP. Catches a PUT that drops appearances or adds `status`.
