# api.athletes: Athlete profile and club history

| App | Status | Entry point (user POV)                   | Verify            | Since        |
| --- | ------ | ---------------------------------------- | ----------------- | ------------ |
| api | live   | `GET /api/athletes/{slug}` and `?sport=` | `vp run api#test` | plan item 8a |

`GET /api/athletes/{slug}` returns `slug`, `name`, `sport`, `country`, optional `birthYear` and `position`, and `clubs` (`{ name, from, to? }`, current spell first, names only). `GET /api/athletes?sport=` returns `{ slug, name }[]` sorted by name. Unknown athlete is HTTP 404 `Unknown athlete`. An unknown sport is HTTP 404 `Unknown sport`. No `results` field. The PGLite suite is the proof; `verify:api` needs Docker and does not load the seed.
