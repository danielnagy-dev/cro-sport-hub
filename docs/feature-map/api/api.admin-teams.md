# api.admin-teams: Admin football clubs

| App | Status | Entry point (user POV) | Verify            | Since         |
| --- | ------ | ---------------------- | ----------------- | ------------- |
| api | live   | `/api/admin/teams`     | `vp run api#test` | plan item 13b |

`GET /api/admin/teams` lists football clubs in name order. `POST /api/admin/teams` and `PUT /api/admin/teams/{id}` store a `teamSchema` club. `DELETE /api/admin/teams/{id}` removes a club that is not a match side and has no club spell. An admin sends `Authorization: Bearer`. No token is 401 `Invalid token`. An editor is 403 `Forbidden`. A tennis `sportId` is 400 `Teams are football clubs` and nothing is stored. A duplicate id is 409 `That record is already stored`. An unknown id is 404 `Unknown team`. A club that is still a match side, or that still has an `athlete_teams` row, is 409 `Team is in use`. An unused club deletes with 204. There is no public `/api/teams` and no club page.

#### How to get to it (user POV)

- `GET http://localhost:3001/api/admin/teams` with an admin bearer token. `POST` and `PUT` send the club. `DELETE` uses the club id. Shapes are on `GET /docs-json`.

#### Driving it with verify

`vp run verify:api` stays on the public GETs and does not send an admin token. The PGLite HTTP suite covers the four routes, the football-club rejection, delete conflicts, and `/docs-json`.

#### Gotchas

- The seed clubs `club-sample-home`, `club-sample-away`, and `club-sample-town` are in use. The seed has no crests.
