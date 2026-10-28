# api.login: JWT login for seeded studio users

| App | Status | Entry point (user POV) | Verify            | Since        |
| --- | ------ | ---------------------- | ----------------- | ------------ |
| api | live   | `POST /api/login`      | `vp run api#test` | plan item 10 |

`POST /api/login` with `{ "id", "password" }` returns `{ "token" }` when the password matches the hash `vp run api#seed` stored for `editor-demo` or `admin-demo`. A wrong password, an unknown id, and a null hash are HTTP 401 `Invalid credentials`. A body that fails validation is HTTP 400. The HS256 token expires in 12 hours and carries `sub` and `role`. Send `Authorization: Bearer <token>`. `EditorGuard` allows editor and admin. `AdminGuard` allows admin only. `EditorGuard` is attached to the draft save routes, submit, the editor lookups, and `GET /api/editor/matches`. `AdminGuard` is on reject, `/api/admin/teams`, and `/api/admin/competitions`. `GET /api/matches` stays public.

`EDITOR_DEMO_PASSWORD`, `ADMIN_DEMO_PASSWORD`, and `JWT_SECRET` (at least 32 characters) come from the environment. Placeholders are in `.env.example`. Boot does not require `JWT_SECRET`.

#### How to get to it (user POV)

- `POST http://localhost:3001/api/login`. The shape is on `GET /docs-json`.

#### Driving it with verify

The verify CLI only sends GET, so it cannot log in. `vp run verify:api` and `vpx tools/verify/verify.ts api --route /api/matches` stay HTTP 200 with no bearer token. The API unit tests cover a signed token, HTTP 401, a bad body, and both guards. The handler sets HTTP 200 because Nest's POST default is 201.
