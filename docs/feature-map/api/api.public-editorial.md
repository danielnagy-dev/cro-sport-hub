# api.public-editorial: Public editorial reads

| App | Status | Entry point (user POV)                                                                            | Verify                                               | Since |
| --- | ------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----- |
| api | live   | `GET /api/public/appearances`, `/athletes`, `/athletes/{slug}`, `/national-teams/{slug}/schedule` | `vp run api#test`; `verify:api --route` needs Docker | #193  |

Unauthenticated GETs. Day list uses `day` (optional `sportSlug`); empty when none. Athlete index is `{ slug, name }[]` by `sport`. Profile returns `history` / `upcoming`. National-team schedule returns `past` / `current` / `upcoming` by status. Responses omit creator, publish-slot, and network-post fields. Unknown athlete/team/sport → 404; invalid day → 400. Redis cache deferred.
