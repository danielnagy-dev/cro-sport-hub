# api.match-workflow: Submit a draft and reject a review

| App | Status | Entry point (user POV)                  | Verify            | Since         |
| --- | ------ | --------------------------------------- | ----------------- | ------------- |
| api | live   | `POST /api/matches/{id}/submit,/reject` | `vp run api#test` | plan item 12a |

`POST /api/matches/{id}/submit` moves a draft to review. An editor or an admin sends `Authorization: Bearer`. The response is HTTP 200 `{ id, status: "review" }`. The row does not gain `reviewedBy` or `publishedAt`. `POST /api/matches/{id}/reject` is admin only. The row must be in review. It becomes draft, and `reviewedBy` and `publishedAt` are cleared. The response is HTTP 200 `{ id, status: "draft" }`. A missing token is HTTP 401 `Invalid token`. An editor calling reject is HTTP 403 `Forbidden`. Submit of any other status is HTTP 409 `Only a draft can be submitted`. Reject of any other status is HTTP 409 `Only a match in review can be rejected`. An unknown id is HTTP 404 `Unknown match`. Publish is a later route. `GET /api/matches` stays public, and a match in review is not on that list.

#### How to get to it (user POV)

- `POST http://localhost:3001/api/matches/{id}/submit` or `/reject` with a bearer token. Shapes are on `GET /docs-json`.

#### Driving it with verify

The verify CLI only sends GET, so the transitions are the PGLite HTTP suite (`vp run api#test`). `vp run verify:api --route /api/matches` checks the public list still needs no token. That run needs Docker.

#### Gotchas

- Submit does not record who sent it. Reject clears a reviewer. Publish, which records one, is a later route.
- Reject of a draft or a published row is HTTP 409. It does not clear those rows.
- Nest's POST default is 201. These two routes set HTTP 200.
