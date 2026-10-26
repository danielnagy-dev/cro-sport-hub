# 8a: Athlete profile and club history

**What to build:** `GET /api/athletes/:slug` returns the public profile and club history. `GET /api/athletes?sport=` returns the slug and name for one sport. No results yet. This note is the spec.

**Blocked by:** None. The catalog, the seed, and the published match reads are on main.

**Status:** resolved

**Size:** 340 counted lines. The published match list (plan 7) was both sports plus paging in one diff; this is one profile select, one club-name join, and a short slug list.

## Scope

In: both routes, OpenAPI, and the shared response schemas. Profile fields are `slug`, `name`, `sport` (`tennis` or `football`), `country`, and the optional `birthYear` and `position`. Clubs are `{ name, from, to? }`, current spell first (`to` absent), then older spells. Names only: no team id, slug, country, or crest. `GET /api/athletes?sport=tennis` and `?sport=football` return `{ slug, name }[]` sorted by name. A slug that is not an athlete is HTTP 404 `Unknown athlete`. A sport query that is not a sports row is HTTP 404 `Unknown sport`. The body has no `results` field.

`karlo-brkic` is the football proof: Sample Town from `2023-07-01` to `2025-06-30`, then Sample Home from `2025-07-01`. `sample-player-a` is the tennis proof: an empty club list.

Out: tennis results (8b) and football appearances (8c). No web page, no cache, no new dependency, no ADR. `0001`–`0005` stay as they are. Update `docs/feature-map.md` with `api.athletes`.

## Order

Plan is this note. Architect sketches the response schemas below, then develop. No ADR. The author self-reviews. Daniel squash-merges.

## Acceptance

- [x] `GET /api/athletes/karlo-brkic` returns Karlo Brkić, football, and the two Sample clubs in the order above. The JSON has no team id, slug, country, or crest.
- [x] `GET /api/athletes/sample-player-a` returns Sample Player A, tennis, and `"clubs": []`.
- [x] `GET /api/athletes/nobody` is HTTP 404 and the message is `Unknown athlete`.
- [x] `GET /api/athletes?sport=football` returns the five seeded football slugs and no tennis slug. `?sport=curling` is HTTP 404 `Unknown sport`.
- [x] Neither body has a `results` field.
- [x] `/docs-json` documents both paths, including the 404s.

## Verification

`vp run verify:api --route /api/athletes?sport=tennis` needs Docker. Proof when Docker is absent is the PGLite HTTP suite. Say so in the results table. `docs/feature-map.md` records `api.athletes`.

## Architect

Yes. New response schemas live in `libs/shared-types`. No ADR: this is the published-match pattern (public names, catalog ids stay in `apps/api`). Apps do not import each other. Web does not call the paths in this slice.

### Seams

- `GET /api/athletes/:slug` against the seeded PGLite catalog. Catches a leaked club id, a dropped spell, and an unknown slug.
- `GET /api/athletes?sport=`. Catches the other sport in the list, and an unknown sport slug.
- `GET /docs-json`. Catches a path missing from OpenAPI.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/28
