# api.editor-matches: Editorial match list across sports

| App | Status | Entry point (user POV)    | Verify            | Since         |
| --- | ------ | ------------------------- | ----------------- | ------------- |
| api | live   | `GET /api/editor/matches` | `vp run api#test` | plan item 23a |

`GET /api/editor/matches` lists tennis and football matches for an editor or an admin, including drafts. Optional filters are `sport` (`tennis` or `football`), `status` (`draft`, `review`, or `published`), and `source` (`manual` or `import`). Newest `match_date` first, then `id`. Each item is `id`, `sport`, `competition`, `date`, `round`, `status`, `source`, and `label` (`Player A vs Player B` or `Home vs Away`). There is no club id and no stat count. `limit` defaults to 20 and is 1–50. `offset` defaults to 0. A bad query is HTTP 400. No token is HTTP 401 `Invalid token`. Any other signed role is HTTP 403 `Forbidden`. `GET /api/matches` stays published-only.

#### How to get to it (user POV)

- `GET http://localhost:3001/api/editor/matches` with `Authorization: Bearer`. The shape is on `GET /docs-json`.

#### Driving it with verify

The verify CLI sends GET and does not send a bearer. `vp run verify:api --route /api/matches` checks the public list. Do not add `/api/editor/matches`: without a token that route is HTTP 401, and a 401 fails the run. The PGLite HTTP suite is the proof for this list.

#### Gotchas

- `source=import` is an empty page on the sample seed. Every seeded match is `manual`.
- The seeded quarterfinal is a draft. It is on this list and absent from `GET /api/matches`.
