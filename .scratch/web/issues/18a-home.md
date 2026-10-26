# 18a: Latest results on the home page

**What to build:** The public home page server-renders the latest published matches, tennis and football, using `MatchCard`. The read client parses the published page, not a `Match` array. This note is the spec.

**Blocked by:** None. Plan items 7 and 17 are on main. `GET /api/matches` returns `publishedMatchPageSchema`.

**Status:** resolved

**Size:** 300 counted lines. One page, the client method, and the tests that today expect a `Match` array. Plan 17 left the page as a heading.

## Scope

In: the home page fetches `GET /api/matches` on the server and renders one `MatchCard` per item, newest first, as the API orders them. The heading stays `Cro Sport Hub`. An empty page shows `No published results.` A failed fetch still renders the heading and `Results are unavailable.` so `verify:web` passes when the API is down. Home `<title>` and meta description name tennis and football results. No Open Graph image (the repo has no share image).

`createApiClient().matches()` returns `PublishedMatchPage`. It stops parsing `matchSchema.array()`. `/api/sports` stays uncalled. There is still no sports route.

Out: `/tennis` and `/football` (18b), athlete pages, and links that would 404 until 18b. Do not add `GET /api/sports`. Update `docs/feature-map.md`: `web.home-placeholder` becomes the results home. `verify:web` still proves the heading. The cards are the unit test, unless Docker is up and the author also ran the page against the API. Say which one in the results table. `next dev` may rewrite `apps/web/AGENTS.md`; commit that file as it is.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [x] A fixture page with the seeded final and the seeded league match renders Sample Player A, Sample Player B, Sample Home, Sample Away, and the football goals. Order follows the fixture.
- [x] An empty `items` array renders `No published results.` The heading is still `Cro Sport Hub`.
- [x] A rejected fetch renders `Results are unavailable.` and the heading. It does not throw.
- [x] The client accepts a published page and rejects a bare `Match` array.
- [x] The document title mentions results. There is no `og:image`.

## Verification

`vp run verify:web` proves the heading. Card contents are the unit test with a fixture fetch. A live list needs the API and Docker; if that did not run, say so. Update `web.home` in `docs/feature-map.md`.

## Architect

No. `publishedMatchPageSchema` already exists. The web client was still on the pre-plan-7 `Match` array. Studio does not import the web client.

### Seams

- The home page render with a stubbed fetch. Catches a draft-shaped `Match` drawn as a card, a thrown fetch, and an empty page with no message.
- `createApiClient().matches()`. Catches a client that still parses `matchSchema`.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/27
