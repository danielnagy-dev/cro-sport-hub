# api.match-workflow: Submit, reject, and publish

| App | Status | Entry point (user POV)                           | Verify            | Since         |
| --- | ------ | ------------------------------------------------ | ----------------- | ------------- |
| api | live   | `POST /api/matches/{id}/submit,/reject,/publish` | `vp run api#test` | plan item 12a |

`POST /api/matches/{id}/submit` moves a draft to review. An editor or an admin sends `Authorization: Bearer`. The response is HTTP 200 `{ id, status: "review" }`. The row does not gain `reviewedBy` or `publishedAt`. `POST /api/matches/{id}/reject` is admin only. The row must be in review. It becomes draft, and `reviewedBy` and `publishedAt` are cleared. The response is HTTP 200 `{ id, status: "draft" }`. `POST /api/matches/{id}/publish` is admin only. The row must be in review. It becomes `published`, `reviewedBy` is the caller id, and `publishedAt` is the current time with a numeric offset. The response is HTTP 200 `{ id, status: "published" }`. After a successful publish, public Redis keys from plan item 9b are cleared. `saveDraft` clears them on every successful write too. A hook error does not change the HTTP status of a transition that already committed. A missing token is HTTP 401 `Invalid token`. An editor calling reject or publish is HTTP 403 `Forbidden`. Submit of any other status is HTTP 409 `Only a draft can be submitted`. Reject of any other status is HTTP 409 `Only a match in review can be rejected`. Publish of any other status is HTTP 409 `Only a match in review can be published`. An unknown id is HTTP 404 `Unknown match`. `GET /api/matches` stays public, and a match in review is not on that list until it is published.

#### How to get to it (user POV)

- `POST http://localhost:3001/api/matches/{id}/submit`, `/reject`, or `/publish` with a bearer token. Shapes are on `GET /docs-json`.

#### Driving it with verify

The verify CLI only sends GET, so the transitions are the PGLite HTTP suite (`vp run api#test`). `vp run verify:api --route /api/matches` checks the public list still needs no token. That run needs Docker and does not publish a match.

#### Gotchas

- Submit does not record who sent it. Reject clears a reviewer. Publish records one and a publish time.
- Reject or publish of a draft or a published row is HTTP 409. Those routes do not demote a published row; `saveDraft` does.
- Nest's POST default is 201. These routes set HTTP 200.
