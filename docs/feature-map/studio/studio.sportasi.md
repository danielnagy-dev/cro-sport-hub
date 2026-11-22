# studio.sportasi: Athletes list and create/update

| App    | Status | Entry point (user POV)           | Verify                                   | Since |
| ------ | ------ | -------------------------------- | ---------------------------------------- | ----- |
| studio | live   | `http://localhost:4200/sportasi` | `vp run studio#test` and `verify:studio` | #216  |

Editor list/create/update on `GET|POST|PUT /api/editor/tracked-athletes` with `?sport=` filter (`core/editor-athletes-api.ts`). Guest → `/login`.
