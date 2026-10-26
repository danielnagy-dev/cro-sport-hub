# 24d: Reopen a tennis draft

**What to build:** An editor can open a saved tennis draft, see the score and the stats, and save it again with `PUT`. The matches table links tennis rows here. This note is the spec.

**Blocked by:** 24c (`.scratch/studio/issues/24c-tennis-stats-submit.md`). `PUT /api/matches/tennis/:id` is on main (plan 11b, PR #24). 24c already waits on 24b.

**Status:** ready-for-agent

**Size:** 280 counted lines. One editor GET that returns the draft body, and the 24c form bound to that body. The fields already exist.

## Scope

In: `GET /api/editor/matches/tennis/:id`, editor or admin. The body is the same shape `POST /api/matches/tennis` accepts, including `stats` when they are stored, plus `status`. No percentage field. A football id is HTTP 404 `Unknown match`. A missing token is HTTP 401 `Invalid token`. OpenAPI marks the path with bearer security.

Studio route `/matches/:id/tennis` loads that GET into the 24c form and saves with `PUT /api/matches/tennis/:id`. The matches table links a tennis row to this route. Unknown id shows `Match not found`.

Out: football edit (25c) and a public GET. Update `studio.tennis-form` and `api.editor-matches` in `docs/feature-map.md`.

## Order

Plan is this note. No architect step. The response is the draft body plan 11 already parses. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] `GET /api/editor/matches/tennis/match-sample-qf` returns the seeded quarterfinal's players, score, and `status: draft`, and returns no percentage field.
- [ ] The same path with the seeded football id is HTTP 404 `Unknown match`. No token is HTTP 401.
- [ ] Opening `/matches/:id/tennis` fills the form from that GET. Save sends `PUT` and does not send `status` or a percentage.
- [ ] A tennis row in the matches table links to that route.

## Verification

PGLite HTTP suite for the GET. `vp run studio#test` for the filled form. Verify has no bearer. Say that.

## Architect

No. The draft body is plan 11. This slice adds the read that the form was missing. No new schema package and no ADR.

### Seams

- `GET /api/editor/matches/tennis/:id` on PGLite. Catches a percentage on the body, and a football id that returns a tennis form.
- The edit form, stubbed HTTP. Catches a PUT that includes `status`.
