# api.appearances: Editorial appearances

| App | Status | Entry point (user POV)                                                                                                                                                                         | Verify                                       | Since       |
| --- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------- |
| api | live   | `GET/POST/PUT /api/editor/appearances`; list filters `day`, `sportSlug`, `athleteId`, `athleteSlug`, `nationalTeamId`, `from`, `to`; lineup `POST …/:id/lineup`, `PUT …/:id/lineup/:athleteId` | `vp run api#test`; `verify:api` needs Docker | #190 / #206 |
