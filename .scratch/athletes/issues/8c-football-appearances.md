# 8c: Football appearances on the athlete read

**What to build:** A football `GET /api/athletes/:slug` gains `results`: one item per appearance in a published match. Counts stay the stored appearance fields. This note is the spec.

**Blocked by:** 8b (`.scratch/athletes/issues/8b-tennis-results.md`), so the tennis `results` object is already on the schema this slice extends.

**Status:** ready-for-agent

**Size:** 300 counted lines. The same shape as 8b, on the appearance table plan 5b already stores. One sport, no new formula.

## Scope

In: `results` on the football profile. Each item has `id` (the match id), `competition`, `date`, `round`, `club` (the name), `started`, `minutes`, `goals`, `assists`, `yellowCards`, and `redCard`. No team id. Newest match date first. Draft and review matches are absent. The tennis body from 8b stays as 8b defined it. OpenAPI describes the football results.

Out: the web page (19c), cache, and any derived column. Extend `api.athletes` in `docs/feature-map.md`.

## Order

Plan is this note. Architect sketches the football result on the 8a schema. No ADR. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] `GET /api/athletes/karlo-brkic` includes Sample League, Matchday 8, `2026-10-19`, club Sample Home, started, 90 minutes, 2 goals, 0 assists, `yellowCards` 0, `redCard` false.
- [ ] `GET /api/athletes/filip-saric` has `yellowCards` 2 and `redCard` true. `GET /api/athletes/bruno-peric` has `minutes` 0, `started` false, and `yellowCards` 1.
- [ ] An appearance on a draft match is absent.
- [ ] `GET /api/athletes/sample-player-a` still returns the tennis final from 8b and gains no football fields.
- [ ] `/docs-json` documents football `results`.

## Verification

Same as 8a. Route `/api/athletes/karlo-brkic` when Docker is up. PGLite otherwise.

## Architect

Yes, for the football result object. No ADR. The fields are `appearanceSchema` plus the club name. Hidden catalog ids stay off the body, as on the published match list.

### Seams

- `GET /api/athletes/karlo-brkic` and `GET /api/athletes/filip-saric` on the seeded catalog. Catches a draft appearance, a club id, and a card pair that does not match the stored counts.
- `GET /docs-json`. Catches football results missing from OpenAPI.
