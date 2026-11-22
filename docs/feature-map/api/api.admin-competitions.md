# api.admin-competitions: Admin competitions

| App | Status  | Entry point (user POV)    | Verify            | Since         |
| --- | ------- | ------------------------- | ----------------- | ------------- |
| api | retired | `/api/admin/competitions` | `vp run api#test` | plan item 13a |

**Retired (Phase H / #265).** Admin competitions Nest controller, controller specs, feature module (`features/admin-competitions/`), and `competition-admin.ts` helpers are deleted. Folder auto-load no longer registers an AdminCompetitionsModule, so `/api/admin/competitions` is gone. Admin teams remain until #266; fixture import until #267. Studio admin UI is already retired (`studio.admin`). Editor form lists stay on `GET /api/editor/competitions`.

Historical behaviour: an admin listed, created, updated, and deleted competitions at `/api/admin/competitions`. The list was every competition, name order. Create and update returned the stored row (`id`, `sportId`, `name`, `season`, `level`). Delete of an unused competition was HTTP 204. A competition that still had a match, including seeded `comp-sample-cup`, was HTTP 409 `Competition is in use` and the row stayed. A repeated id was HTTP 409 `That record is already stored`. A sport id that was not a sports row was HTTP 400 `Unknown row`. An unknown id was HTTP 404 `Unknown competition`. A missing token was HTTP 401 `Invalid token`. An editor token was HTTP 403 `Forbidden`. There was no `/api/competitions` route.

#### How to get to it (user POV)

HTTP routes and the competition-admin helpers are retired. Former routes (for history):

- `GET`, `POST`, `PUT`, or `DELETE` `http://localhost:3001/api/admin/competitions` with an admin bearer token. `PUT` and `DELETE` added the id.

Shapes on `GET /docs-json` no longer include an admin-competitions tag. Swagger UI is `/docs`.

#### Driving it with verify

`vp run verify:api` does not send an admin token. Controller, PGLite HTTP suite, and helpers are gone (#265). Remaining API tests must pass without `apps/api/src/features/admin-competitions/` or `competition-admin.ts`.
