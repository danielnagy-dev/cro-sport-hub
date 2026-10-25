# 07: Latest published matches

**What to build:** Public `GET /api/matches` returns published matches only, newest first, paginated, and documented in OpenAPI. A football row embeds the two club names and nothing else from the club. This note is the spec.

**Blocked by:** Plan item 5 (PRs #11 and #12) and plan item 6 (PR #15, `.scratch/seed/issues/06-seed-data.md`).

**Status:** resolved

## Scope

In: `GET /api/matches`. `published` rows only, newest `match_date` first, `id` as the tie-break. The body is a page (`items`, `limit`, `offset`, `total`) parsed with `publishedMatchPageSchema`. `limit` defaults to 20 and is 1–50. `offset` defaults to 0. A bad page query is 400. Tennis items carry the two player names, the score, and the winner side. Football items carry `homeTeam` and `awayTeam` names plus the goals. No club id, slug, country, or crest. OpenAPI at `/docs-json` describes the path.

The query filters `status` and orders by `match_date`, so it uses `matches_date_sport` from `0002`. No new index. `0001`–`0003` stay as they are.

Out: the by-sport list. That query filters `sport_id` and `status`, which `matches_date_sport` cannot seek, so it is the follow-up `.scratch/matches/issues/07b-matches-by-sport.md` (this pull request does not add that file) and adds `matches_sport_status_date` there. Also out: team endpoints, club pages, athlete pages, the sports list, studio, and the web client. The web client still expects a `Match` array and is not called from the home page. No new dependency and no ADR.

## Order

Plan, then architect (sketch only, below), then develop. Pre-launch: the author self-reviews. Daniel squash-merges. That merge is the final gate.

## Acceptance

- [x] `GET /api/matches` on the seeded catalog returns the published football match, then the published tennis final. The draft quarterfinal is absent. A newer unpublished football match is absent.
- [x] `limit` and `offset` page that list. `total` counts published rows only.
- [x] The JSON body parses with `publishedMatchPageSchema`. Editorial fields and club ids are not in the body.
- [x] `limit=0` is HTTP 400.
- [x] `/docs-json` documents `/api/matches`, including `homeTeam` and `playerA`. It has no team path.

## Verification

`vp run verify:api` needs Docker. Proof when Docker is absent is the PGLite HTTP suite. Say so in the results table.

## Architect

No ADR. `listPublishedMatches` on the existing catalog is the read. The HTTP handler is the public seam. `libs/shared-types` owns the page schema. Apps do not import each other. Rejected: returning stored `Match` rows (they leak workflow fields and have no club names), a general catalog filter (ADR-002), and editing `0002`.

### Seams

- `GET /api/matches` against the seeded PGLite catalog. Catches an unpublished row, a page that skips or repeats, a football item with anything but the club names, and a body the shared schema rejects.
- `GET /docs-json`. Catches a path or a club-name field missing from OpenAPI.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/18
