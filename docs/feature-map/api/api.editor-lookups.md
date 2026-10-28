# api.editor-lookups: Editor lookups for the match forms

| App | Status | Entry point (user POV)         | Verify            | Since         |
| --- | ------ | ------------------------------ | ----------------- | ------------- |
| api | live   | `GET /api/editor/competitions` | `vp run api#test` | plan item 24a |

`GET /api/editor/competitions?sport=tennis|football` returns `{ id, name, season }[]` in name order for that sport. `GET /api/editor/athletes?sport=` returns `{ id, name }[]` in name order. `GET /api/editor/teams` returns football clubs `{ id, name }[]` in name order. A missing or unknown sport is HTTP 400 `Unknown sport`. An editor or an admin sends `Authorization: Bearer`. No token is HTTP 401 `Invalid token`. Any other role is HTTP 403 `Forbidden`. There is no paging and no public `/api/teams`. OpenAPI marks the three paths with bearer security.

#### How to get to it (user POV)

- `GET http://localhost:3001/api/editor/competitions?sport=tennis` with a bearer token. Athletes use the same query. Clubs are `GET /api/editor/teams`. Shapes are on `GET /docs-json`.

#### Driving it with verify

Verify's GET has no bearer, so these routes are not `--route` checks. A request without a token is HTTP 401 and would fail `vp run verify:api`. The PGLite HTTP suite is the proof.
