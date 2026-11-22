# api.admin-teams: Admin football clubs

| App | Status  | Entry point (user POV) | Verify            | Since         |
| --- | ------- | ---------------------- | ----------------- | ------------- |
| api | retired | `/api/admin/teams`     | `vp run api#test` | plan item 13b |

**Retired (Phase H / #266).** Admin teams Nest controller, controller specs, and feature module (`features/admin-teams/`) are deleted. Folder auto-load no longer registers an AdminTeamsModule, so `/api/admin/teams` is gone. Fixture import remains until #267. Studio admin UI is already retired (`studio.admin`). Editor form lists stay on `GET /api/editor/teams`. Catalog team write/read and table drop stay outside this ticket (#186).

Historical behaviour: `GET /api/admin/teams` listed football clubs in name order. `POST /api/admin/teams` and `PUT /api/admin/teams/{id}` stored a `teamSchema` club. `DELETE /api/admin/teams/{id}` removed a club that was not a match side and had no club spell. An admin sent `Authorization: Bearer`. No token was 401 `Invalid token`. An editor was 403 `Forbidden`. A tennis `sportId` was 400 `Teams are football clubs` and nothing was stored. A duplicate id was 409 `That record is already stored`. An unknown id was 404 `Unknown team`. A club that was still a match side, or that still had an `athlete_teams` row, was 409 `Team is in use`. An unused club deleted with 204. There was no public `/api/teams` and no club page.

#### How to get to it (user POV)

HTTP routes are retired. Former routes (for history):

- `GET http://localhost:3001/api/admin/teams` with an admin bearer token. `POST` and `PUT` sent the club. `DELETE` used the club id.

Shapes on `GET /docs-json` no longer include an admin-teams tag. Swagger UI is `/docs`.

#### Driving it with verify

`vp run verify:api` stays on the public GETs and does not send an admin token. Controller and PGLite HTTP suite are gone (#266). Remaining API tests must pass without `apps/api/src/features/admin-teams/` or `admin-teams.controller.ts`.

#### Gotchas

- The seed clubs `club-sample-home`, `club-sample-away`, and `club-sample-town` remain in the catalog seed. The seed has no crests.
