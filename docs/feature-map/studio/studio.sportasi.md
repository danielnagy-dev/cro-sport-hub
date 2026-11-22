# studio.sportasi: Athletes list and create/update

| App    | Status | Entry point (user POV)           | Verify                                   | Since |
| ------ | ------ | -------------------------------- | ---------------------------------------- | ----- |
| studio | live   | `http://localhost:4200/sportasi` | `vp run studio#test` and `verify:studio` | #216  |

Tracked-athlete list behind `editorGuard`, fed by `GET /api/editor/tracked-athletes` (`core/editor-athletes-api.ts`). Sport filter via `?sport=`. Inline Novi sportaš / Uredi form POSTs and PUTs the same API. HR copy from `core/messages` (`sportasi.*`). Profile route deferred to a sibling slice. Guest → `/login`.
