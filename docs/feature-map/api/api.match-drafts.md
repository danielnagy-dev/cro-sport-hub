# api.match-drafts: Save tennis and football drafts

| App | Status | Entry point (user POV)                   | Verify            | Since        |
| --- | ------ | ---------------------------------------- | ----------------- | ------------ |
| api | live   | `POST/PUT /api/matches/tennis,/football` | `vp run api#test` | plan item 11 |

`POST /api/matches/tennis` and `POST /api/matches/football` create a match. `PUT` on that path plus an id replaces one. Both force `status: draft`. An editor or admin sends `Authorization: Bearer`. No token is 401. Any other signed role is 403. The public `GET` routes stay open. Tennis takes a set score and optional raw stat counts. Football takes a score and optional appearances. Percentage fields are rejected. The response is `{ id, status: "draft", sport }`.

#### How to get to it (user POV)

- `POST http://localhost:3001/api/matches/tennis` or `/api/matches/football` with a bearer token. `PUT` adds the match id. Shapes are on `GET /docs-json`.

#### Driving it with verify

The verify CLI only sends GET, so `vp run verify:api` proves the public reads and `/docs`. Validation and draft status are the catalog suite. The role check is the HTTP suite.

#### Gotchas

- A new draft is not on the public list. Editing a published match returns it to draft and removes it from that list.
- `JWT_SECRET` is read on the draft route, not at boot. An edit replaces stats and appearances.
