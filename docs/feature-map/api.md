# API

Entries for the API. Shared preconditions and driving conventions are in `docs/feature-map.md`.

## Index

| ID                     | Feature                                | App | Status | Entry point (user POV)                   | Verify              | Since                                             |
| ---------------------- | -------------------------------------- | --- | ------ | ---------------------------------------- | ------------------- | ------------------------------------------------- |
| api.health             | Health check                           | api | live   | `GET /health`                            | `vp run verify:api` | plan items for the API skeleton (formerly GH #35) |
| api.openapi            | OpenAPI docs                           | api | live   | `http://localhost:3001/docs`             | `vp run verify:api` | plan items for the API skeleton (formerly GH #35) |
| api.matches            | Published matches, latest and by sport | api | live   | `GET /api/matches` and `/{sport}`        | `vp run verify:api` | plan items 7 and 7b                               |
| api.athletes           | Athlete profile and club history       | api | live   | `GET /api/athletes/{slug}` and `?sport=` | `vp run api#test`   | plan item 8a                                      |
| api.login              | JWT login for seeded studio users      | api | live   | `POST /api/login`                        | `vp run api#test`   | plan item 10                                      |
| api.match-drafts       | Save tennis and football drafts        | api | live   | `POST/PUT /api/matches/tennis,/football` | `vp run api#test`   | plan item 11                                      |
| api.match-workflow     | Submit a draft and reject a review     | api | live   | `POST /api/matches/{id}/submit,/reject`  | `vp run api#test`   | plan item 12a                                     |
| api.admin-competitions | Admin competitions                     | api | live   | `/api/admin/competitions`                | `vp run api#test`   | plan item 13a                                     |
| api.admin-teams        | Admin football clubs                   | api | live   | `/api/admin/teams`                       | `vp run api#test`   | plan item 13b                                     |
| api.editor-lookups     | Editor lookups for the match forms     | api | live   | `GET /api/editor/competitions`           | `vp run api#test`   | plan item 24a                                     |

Planned paths are estimates. The change that builds each feature updates its row.

## Feature entries

### api.health: Health check

`GET /health` reports whether the API process can reach local Postgres and Redis. The body has `status` (`ok` or `error`), `postgres`, `redis`, and the linked package ids. HTTP 200 means both dependencies are up. HTTP 503 means the process is up and a dependency is not.

#### Sub-features

- `api.health-ok` returns HTTP 200 and `"status": "ok"` when Compose is up.
- `api.health-down` returns HTTP 503 when Postgres or Redis is down. That is a failed verify run, not a pass.

#### How to get to it (user POV)

- Request `GET http://localhost:3001/health`.

#### Driving it with verify

Preconditions:

- `vp run verify:doctor` reports Docker running.
- Compose services `postgres` and `redis` are healthy, or the run may start them and must stop them afterwards.
- No root `.env`, or `.env` matches the Compose user, database, and password.

- **Read health.** Run `vp run verify:api`. The `GET /health` row is `pass`, and `health.json` has `"status": "ok"`.

#### Gotchas

- A root `.env` whose `DATABASE_URL` password does not match `POSTGRES_PASSWORD` in `docker-compose.yml` makes `/health` return 503. The run fails on purpose. Do not skip the status check.
- The CLI stops only the Compose services it started.

### api.openapi: OpenAPI docs

Swagger UI at `/docs` describes the API. The machine-readable document is `/docs-json` and includes a top-level `openapi` field. The title in the UI is `Cro Sport Hub API`.

#### Sub-features

- `api.openapi-json` serves the document at `GET /docs-json`.
- `api.openapi-ui` renders Swagger UI at `/docs`.

#### How to get to it (user POV)

- Open `http://localhost:3001/docs`.
- Request `GET http://localhost:3001/docs-json`.

#### Driving it with verify

Preconditions: same as `api.health`.

- **Document.** Run `vp run verify:api`. `GET /docs-json` is `pass` and `openapi.json` contains `"openapi"`.
- **UI.** The same run screenshots `/docs` and requires the text `Cro Sport Hub API`.

#### Gotchas

- There is no global prefix. The paths are `/docs` and `/docs-json`, not `/api/docs`.

### api.matches: Published matches

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

- The seeded quarterfinal is a draft and is not listed. A newer unpublished football match is not on `/api/matches/football`.
- Club names are strings on the football item. v1 has no `/api/teams` route.
- `verify:api` does not load the sample seed. Do not point it at an unknown slug: HTTP 404 fails the run.

### api.athletes: Athlete profile and club history

`GET /api/athletes/{slug}` returns `slug`, `name`, `sport`, `country`, optional `birthYear` and `position`, and `clubs` (`{ name, from, to? }`, current spell first, names only). `GET /api/athletes?sport=` returns `{ slug, name }[]` sorted by name. Unknown athlete is HTTP 404 `Unknown athlete`. An unknown sport is HTTP 404 `Unknown sport`. No `results` field. The PGLite suite is the proof; `verify:api` needs Docker and does not load the seed.

### api.login: JWT login

`POST /api/login` with `{ "id", "password" }` returns `{ "token" }` when the password matches the hash `vp run api#seed` stored for `editor-demo` or `admin-demo`. A wrong password, an unknown id, and a null hash are HTTP 401 `Invalid credentials`. A body that fails validation is HTTP 400. The HS256 token expires in 12 hours and carries `sub` and `role`. Send `Authorization: Bearer <token>`. `EditorGuard` allows editor and admin. `AdminGuard` allows admin only. `EditorGuard` is attached to the draft save routes, submit, and the editor lookups. `AdminGuard` is on reject, `/api/admin/teams`, and `/api/admin/competitions`. `GET /api/matches` stays public.

`EDITOR_DEMO_PASSWORD`, `ADMIN_DEMO_PASSWORD`, and `JWT_SECRET` (at least 32 characters) come from the environment. Placeholders are in `.env.example`. Boot does not require `JWT_SECRET`.

#### How to get to it (user POV)

- `POST http://localhost:3001/api/login`. The shape is on `GET /docs-json`.

#### Driving it with verify

The verify CLI only sends GET, so it cannot log in. `vp run verify:api` and `vpx tools/verify/verify.ts api --route /api/matches` stay HTTP 200 with no bearer token. The API unit tests cover a signed token, HTTP 401, a bad body, and both guards. The handler sets HTTP 200 because Nest's POST default is 201.

### api.match-drafts: Draft match saves

`POST /api/matches/tennis` and `POST /api/matches/football` create a match. `PUT` on that path plus an id replaces one. Both force `status: draft`. An editor or admin sends `Authorization: Bearer`. No token is 401. Any other signed role is 403. The public `GET` routes stay open. Tennis takes a set score and optional raw stat counts. Football takes a score and optional appearances. Percentage fields are rejected. The response is `{ id, status: "draft", sport }`.

#### How to get to it (user POV)

- `POST http://localhost:3001/api/matches/tennis` or `/api/matches/football` with a bearer token. `PUT` adds the match id. Shapes are on `GET /docs-json`.

#### Driving it with verify

The verify CLI only sends GET, so `vp run verify:api` proves the public reads and `/docs`. Validation and draft status are the catalog suite. The role check is the HTTP suite.

#### Gotchas

- A new draft is not on the public list. Editing a published match returns it to draft and removes it from that list.
- `JWT_SECRET` is read on the draft route, not at boot. An edit replaces stats and appearances.

### api.match-workflow: Submit a draft and reject a review

`POST /api/matches/{id}/submit` moves a draft to review. An editor or an admin sends `Authorization: Bearer`. The response is HTTP 200 `{ id, status: "review" }`. The row does not gain `reviewedBy` or `publishedAt`. `POST /api/matches/{id}/reject` is admin only. The row must be in review. It becomes draft, and `reviewedBy` and `publishedAt` are cleared. The response is HTTP 200 `{ id, status: "draft" }`. A missing token is HTTP 401 `Invalid token`. An editor calling reject is HTTP 403 `Forbidden`. Submit of any other status is HTTP 409 `Only a draft can be submitted`. Reject of any other status is HTTP 409 `Only a match in review can be rejected`. An unknown id is HTTP 404 `Unknown match`. Publish is a later route. `GET /api/matches` stays public, and a match in review is not on that list.

#### How to get to it (user POV)

- `POST http://localhost:3001/api/matches/{id}/submit` or `/reject` with a bearer token. Shapes are on `GET /docs-json`.

#### Driving it with verify

The verify CLI only sends GET, so the transitions are the PGLite HTTP suite (`vp run api#test`). `vp run verify:api --route /api/matches` checks the public list still needs no token. That run needs Docker.

#### Gotchas

- Submit does not record who sent it. Reject clears a reviewer. Publish, which records one, is a later route.
- Reject of a draft or a published row is HTTP 409. It does not clear those rows.
- Nest's POST default is 201. These two routes set HTTP 200.

### api.admin-competitions: Admin competitions

An admin lists, creates, updates, and deletes competitions at `/api/admin/competitions`. The list is every competition, name order. Create and update return the stored row (`id`, `sportId`, `name`, `season`, `level`). Delete of an unused competition is HTTP 204. A competition that still has a match, including seeded `comp-sample-cup`, is HTTP 409 `Competition is in use` and the row stays. A repeated id is HTTP 409 `That record is already stored`. A sport id that is not a sports row is HTTP 400 `Unknown row`. An unknown id is HTTP 404 `Unknown competition`. A missing token is HTTP 401 `Invalid token`. An editor token is HTTP 403 `Forbidden`. There is no `/api/competitions` route. Editor form lists are `GET /api/editor/competitions`.

#### How to get to it (user POV)

- `GET`, `POST`, `PUT`, or `DELETE` `http://localhost:3001/api/admin/competitions` with an admin bearer token. `PUT` and `DELETE` add the id. Shapes are on `GET /docs-json`.

#### Driving it with verify

`vp run verify:api` does not send an admin token, so it cannot call these routes. The PGLite suite in `apps/api/src/admin-competitions.controller.spec.ts` covers the four routes, the role checks, and `/docs-json`.

### api.admin-teams: Admin football clubs

`GET /api/admin/teams` lists football clubs in name order. `POST /api/admin/teams` and `PUT /api/admin/teams/{id}` store a `teamSchema` club. `DELETE /api/admin/teams/{id}` removes a club that is not a match side and has no club spell. An admin sends `Authorization: Bearer`. No token is 401 `Invalid token`. An editor is 403 `Forbidden`. A tennis `sportId` is 400 `Teams are football clubs` and nothing is stored. A duplicate id is 409 `That record is already stored`. An unknown id is 404 `Unknown team`. A club that is still a match side, or that still has an `athlete_teams` row, is 409 `Team is in use`. An unused club deletes with 204. There is no public `/api/teams` and no club page.

#### How to get to it (user POV)

- `GET http://localhost:3001/api/admin/teams` with an admin bearer token. `POST` and `PUT` send the club. `DELETE` uses the club id. Shapes are on `GET /docs-json`.

#### Driving it with verify

`vp run verify:api` stays on the public GETs and does not send an admin token. The PGLite HTTP suite covers the four routes, the football-club rejection, delete conflicts, and `/docs-json`.

#### Gotchas

- The seed clubs `club-sample-home`, `club-sample-away`, and `club-sample-town` are in use. The seed has no crests.

### api.editor-lookups: Editor lookups for the forms

`GET /api/editor/competitions?sport=tennis|football` returns `{ id, name, season }[]` in name order for that sport. `GET /api/editor/athletes?sport=` returns `{ id, name }[]` in name order. `GET /api/editor/teams` returns football clubs `{ id, name }[]` in name order. A missing or unknown sport is HTTP 400 `Unknown sport`. An editor or an admin sends `Authorization: Bearer`. No token is HTTP 401 `Invalid token`. Any other role is HTTP 403 `Forbidden`. There is no paging and no public `/api/teams`. OpenAPI marks the three paths with bearer security.

#### How to get to it (user POV)

- `GET http://localhost:3001/api/editor/competitions?sport=tennis` with a bearer token. Athletes use the same query. Clubs are `GET /api/editor/teams`. Shapes are on `GET /docs-json`.

#### Driving it with verify

Verify's GET has no bearer, so these routes are not `--route` checks. A request without a token is HTTP 401 and would fail `vp run verify:api`. The PGLite HTTP suite is the proof.
