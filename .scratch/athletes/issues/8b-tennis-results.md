# 8b: Tennis results on the athlete read

**What to build:** A tennis `GET /api/athletes/:slug` gains `results`: published matches only, newest first, with the score, the raw stat counts, and percentages from `tennisPercentages`. Percentages are computed in that function. They are not a column. This note is the spec.

**Blocked by:** af1, af3, and af5 (ADR-007, `.scratch/api-features/issues/`). 8a is on main (PR #28). This slice adds a function and `docs/feature-map/api/api.athletes.md` after those land, and it does not extend `Catalog` or the area index.

**Status:** resolved

**Size:** 320 counted lines. One sport's join on the published-match select, plus the percentage function that already lives in `libs/shared-types`. Plan 7 was both sports.

## Scope

In: `results` on the tennis profile from 8a. Each item has `id`, `competition`, `date`, `round`, `opponent`, `winner` (`athlete` or `opponent`), `bestOf`, `score`, `retired`, the raw counts `TennisStats` already accepts, and `percentages` from `tennisPercentages`. No stats row means `percentages: null` and the counts omitted. Newest `match_date` first, `id` as the tie-break. Draft and review rows are absent. A football body still has no `results` field. OpenAPI describes the tennis results.

Out: football appearances (8c), the web page (19b), and any percentage column. `0001`–`0005` stay as they are. Extend the `api.athletes` entry in `docs/feature-map.md`.

## Order

Plan is this note. The results schema is the architect sketch below; no ADR. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [x] `GET /api/athletes/sample-player-a` includes the Sample Cup final on `2026-10-18`. The draft quarterfinal on `2026-10-16` is absent. Opponent is Sample Player B, `winner` is `athlete`, the score is 6-4 and 7-6 with tiebreak 5.
- [x] `firstServePct` is 60. `firstServePointsWonPct` equals `tennisPercentages` on those counts (4/6, not a stored number).
- [x] A stats row whose denominator is 0 returns `null` for that percentage. `null` is not 0.
- [x] `GET /api/athletes/karlo-brkic` still has no `results` field.
- [x] `/docs-json` documents tennis `results`.

## Verification

Same as 8a: PGLite HTTP suite when Docker is absent. `vp run verify:api --route /api/athletes/sample-player-a` when Docker is up.

## Architect

Yes, for the results object on the 8a schema. No ADR. `tennisPercentages` stays the only formula. The handler maps counts through it. The select does not read a percentage column, because there is not one.

### Seams

- `GET /api/athletes/sample-player-a` on the seeded catalog. Catches the draft quarterfinal, a percentage that is not `tennisPercentages`, and a 0 where the denominator was 0.
- `GET /docs-json`. Catches tennis results missing from OpenAPI.

## Comments

- https://github.com/danielnagy-dev/cro-sport-hub/pull/41
