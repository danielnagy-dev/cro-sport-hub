# api.athletes: Athlete profile and club history

| App | Status | Entry point (user POV)                   | Verify            | Since        |
| --- | ------ | ---------------------------------------- | ----------------- | ------------ |
| api | live   | `GET /api/athletes/{slug}` and `?sport=` | `vp run api#test` | plan item 8a |

`GET /api/athletes/{slug}` returns `slug`, `name`, `sport`, `country`, optional `birthYear` and `position`, and `clubs` (`{ name, from, to? }`, current spell first, names only). `GET /api/athletes?sport=` returns `{ slug, name }[]` sorted by name. Unknown athlete is HTTP 404 `Unknown athlete`. An unknown sport is HTTP 404 `Unknown sport`.

Tennis profiles add `results`: published matches only, newest `match_date` first (`id` breaks ties). Each item has `id`, `competition`, `date`, `round`, `opponent`, `winner` (`athlete` or `opponent`), `bestOf`, `score`, `retired`, optional raw stat counts, and `percentages` from `tennisPercentages` (computed in the API, not stored). No stats row means `percentages: null` and the counts are omitted.

Football profiles add `results`: published appearances only, newest `match_date` first (`id` breaks ties). Each item has `id`, `competition`, `date`, `round`, `club` (name only), `started`, `minutes`, `goals`, `assists`, `yellowCards`, and `redCard` from the stored appearance row.

Responses are cached in Redis for 60 seconds (`pub:v1:athletes:` keys). A reader can see the same profile or name list for up to a minute after a row changes until `invalidatePublicReads` runs (plan item 12b on publish).

The PGLite suite is the proof; `verify:api --route /api/athletes/karlo-brkic` needs Docker and does not load the seed.
