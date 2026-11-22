# studio.sportasi: Athletes list, create/update, and profile

| App    | Status | Entry point (user POV)                                  | Verify                                   | Since |
| ------ | ------ | ------------------------------------------------------- | ---------------------------------------- | ----- |
| studio | live   | `http://localhost:4200/sportasi`                        | `vp run studio#test` and `verify:studio` | #216  |
| studio | live   | `http://localhost:4200/sportasi/:id?sport=` (from list) | `vp run studio#test` and `verify:studio` | #220  |

Editor list/create/update on `GET|POST|PUT /api/editor/tracked-athletes` with `?sport=` filter (`core/editor-athletes-api.ts`). Profile loads the athlete from that list, appearances via `AppearancesApi.listForAthlete` on `GET /api/editor/appearances?athleteId=` (`core/appearances-api.ts`, includes national-team lineup membership), related publish-slot posts by appearance day (`core/publish-slots-api.ts`), and sources per appearance (`core/sources-api.ts`). Empty posts/sources are OK. Guest → `/login`.
