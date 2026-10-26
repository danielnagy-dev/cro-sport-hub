# 07b: Published matches for one sport

**What to build:** Public `GET /api/matches/:sport` returns published matches for that sport only, newest first, paginated, with the same embedded names as `GET /api/matches`, and documented in OpenAPI. A slug that is not a sports row is HTTP 404 with message `Unknown sport`. This note is the spec.

**Blocked by:** Plan item 7 (PR #18).

**Status:** resolved

## Scope

In: `GET /api/matches/:sport`. `sport` is the catalog slug (`tennis` or `football`). Published rows only, newest `match_date` first, `id` as the tie-break. The body is the same page as the latest list (`publishedMatchPageSchema`). `limit` defaults to 20 and is 1–50. `offset` defaults to 0. A bad page query is HTTP 400 with the same message as the latest list. Football items carry `homeTeam` and `awayTeam` names plus the goals. Tennis items carry the two player names, the score, and the winner side. No club id, slug, country, or crest. A known sport with no published rows is HTTP 200 and an empty page. OpenAPI at `/docs-json` describes the path, including the 404.

The query filters `sport_id` and `status` and orders by `match_date`. `matches_date_sport` cannot seek that, so this adds `matches_sport_status_date` on `(sport_id, status, match_date)` as an additive `IF NOT EXISTS` statement. The migration runner splits on every semicolon, so the statement is not a `DO` block. `GET /api/matches` stays on `matches_date_sport` and does not change. `listPublishedMatches` takes an optional sport slug and still uses the same page select.

Out: the sports list, team endpoints, club pages, athlete pages, studio, and the web client. No new dependency and no ADR. `libs/shared-types` stays as it is.

## Order

Plan, then develop. Pre-launch: the author self-reviews. Daniel squash-merges. That merge is the final gate.

## Acceptance

- [x] `GET /api/matches/football` on the seeded catalog returns the published football match and omits the newer draft football match and every tennis row.
- [x] `GET /api/matches/tennis` returns the published final and omits the draft quarterfinal and every football row.
- [x] `GET /api/matches/curling` is HTTP 404 and the message is `Unknown sport`.
- [x] `limit` and `offset` page one sport. `total` counts published rows of that sport only. `limit=0` is HTTP 400 with the same message as the latest list.
- [x] The JSON body parses with `publishedMatchPageSchema`. Editorial fields and club ids are not in the body.
- [x] `/docs-json` documents `/api/matches/{sport}`.

## Verification

`vp run verify:api --route /api/matches/football` needs Docker. Proof when Docker is absent is the PGLite HTTP suite. Say so in the results table. `docs/feature-map.md` records the new path on `api.matches`.

## Architect

No ADR. The read stays `listPublishedMatches` on the existing catalog. The HTTP handler is the public seam. Rejected: a second select, filtering `sport_slug` (the new index leads with `sport_id`), and editing `0001`–`0003`.

### Seams

- `GET /api/matches/:sport` against the seeded PGLite catalog. Catches a draft, the other sport, a page that skips or repeats, and an unknown slug.
- `GET /docs-json`. Catches the by-sport path missing from OpenAPI.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/19
