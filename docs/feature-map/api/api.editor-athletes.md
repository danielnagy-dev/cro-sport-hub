# api.editor-athletes: Studio tracked athletes

| App | Status | Entry point (user POV)                                                           | Verify                                                              | Since |
| --- | ------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----- |
| api | live   | `GET/POST /api/editor/tracked-athletes`, `PUT /api/editor/tracked-athletes/{id}` | `vp run api#test` (auth writes); `verify:api` needs Docker + bearer | #189  |

Editor/admin JWT CRUD for tracked athletes (tennis, football, basketball). `GET` needs `sport=` and optional `q=` (name/slug). Bodies: `athleteSchema` fields plus optional `clubName`. Tag `editor-athletes`. Public `/api/athletes` and lookup `/api/editor/athletes` are separate.
