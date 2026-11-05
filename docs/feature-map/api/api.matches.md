# api.matches: Published matches, latest and by sport

| App | Status | Entry point (user POV)            | Verify              | Since               |
| --- | ------ | --------------------------------- | ------------------- | ------------------- |
| api | live   | `GET /api/matches` and `/{sport}` | `vp run verify:api` | plan items 7 and 7b |

`GET /api/matches` lists published matches, newest date first. `GET /api/matches/{sport}` lists the same page for one sport slug (`tennis` or `football`). Draft and review rows are omitted. The body is a page: `items`, `limit` (default 20, max 50), `offset` (default 0), and `total`. A football item names the two clubs (`homeTeam`, `awayTeam`) and does not include a club id, slug, country, or crest. A tennis item names the two players. There is no public `/api/teams` and no club page. A slug that is not a sports row is HTTP 404 with message `Unknown sport`. A known sport with no published rows is an empty page.

#### How to get to it (user POV)

- Request `GET http://localhost:3001/api/matches`.
- Request `GET http://localhost:3001/api/matches/football` or `/api/matches/tennis`.
- Shapes are on `GET /docs-json`. Swagger UI is `/docs`. `limit=0` is HTTP 400. `/api/matches/curling` is HTTP 404.

#### Driving it with verify

Preconditions: same as `api.health`. Migrations run on the first request. No seeded matches still returns HTTP 200 and an empty page. Football is seeded as a sport, so the by-sport route is empty rather than 404.

- **List.** `vpx tools/verify/verify.ts api --route /api/matches --route /api/matches/football` returns HTTP 200. Seeded rows are proved by the PGLite suite.
- **Document.** `vp run verify:api` saves `openapi.json`. The PGLite suite asserts `/api/matches` and `/api/matches/{sport}` are in that document.

#### Gotchas

- Responses are cached in Redis for 60 seconds (`pub:v1:matches:` keys). A reader can see the same page for up to a minute after a row changes until plan item 9b deletes the key.
- The seeded quarterfinal is a draft and is not listed. A newer unpublished football match is not on `/api/matches/football`.
- Club names are strings on the football item. v1 has no `/api/teams` route.
- `verify:api` does not load the sample seed. Do not point it at an unknown slug: HTTP 404 fails the run.
