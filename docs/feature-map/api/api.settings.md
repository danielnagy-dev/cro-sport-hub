# api.settings: Publish slot clocks and connected-account stubs

| App | Status | Entry point (user POV)                                                                  | Verify                                          | Since |
| --- | ------ | --------------------------------------------------------------------------------------- | ----------------------------------------------- | ----- |
| api | live   | `GET`/`PATCH /api/settings/publish-slot-clocks`, `GET /api/settings/connected-accounts` | `vp run verify:api` (auth routes need a bearer) | #192  |

Authenticated Studio settings for `publish_slot_clocks` (seeded 15:30 / 22:00) and Instagram / Facebook / X stubs with `loginChecked: false`. `EditorAuthGuard` on every route. Zod rejects empty `clocks` and non-`HH:mm` times; unknown ids are HTTP 404. OpenAPI tag: `settings`. Real OAuth and Studio Postavke UI are out of scope.

#### Driving it with verify

Verify GET has no bearer, so auth routes stay in `vp run api#test`. `vp run verify:api` still covers `/health` and `/docs-json`.
