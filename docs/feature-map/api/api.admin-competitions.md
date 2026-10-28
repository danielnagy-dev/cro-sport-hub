# api.admin-competitions: Admin competitions

| App | Status | Entry point (user POV)    | Verify            | Since         |
| --- | ------ | ------------------------- | ----------------- | ------------- |
| api | live   | `/api/admin/competitions` | `vp run api#test` | plan item 13a |

An admin lists, creates, updates, and deletes competitions at `/api/admin/competitions`. The list is every competition, name order. Create and update return the stored row (`id`, `sportId`, `name`, `season`, `level`). Delete of an unused competition is HTTP 204. A competition that still has a match, including seeded `comp-sample-cup`, is HTTP 409 `Competition is in use` and the row stays. A repeated id is HTTP 409 `That record is already stored`. A sport id that is not a sports row is HTTP 400 `Unknown row`. An unknown id is HTTP 404 `Unknown competition`. A missing token is HTTP 401 `Invalid token`. An editor token is HTTP 403 `Forbidden`. There is no `/api/competitions` route. Editor form lists are `GET /api/editor/competitions`.

#### How to get to it (user POV)

- `GET`, `POST`, `PUT`, or `DELETE` `http://localhost:3001/api/admin/competitions` with an admin bearer token. `PUT` and `DELETE` add the id. Shapes are on `GET /docs-json`.

#### Driving it with verify

`vp run verify:api` does not send an admin token, so it cannot call these routes. The PGLite suite in `apps/api/src/admin-competitions.controller.spec.ts` covers the four routes, the role checks, and `/docs-json`.
