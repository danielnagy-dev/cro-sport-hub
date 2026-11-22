# api.editor-matches: Editorial match list across sports

| App | Status  | Entry point (user POV)    | Verify            | Since         |
| --- | ------- | ------------------------- | ----------------- | ------------- |
| api | retired | `GET /api/editor/matches` | `vp run api#test` | plan item 23a |

**Retired (Phase H / #263–#264).** Controller unit spec deleted (#263). Nest controller `editor-matches.controller.ts` and feature module `features/editor-matches/` deleted (#264). Catalog `listEditorMatches` helper removed with the HTTP surface; tennis/football draft readers and table drop stay for #186 / #268. Folder auto-load no longer registers an EditorMatchesModule, so editorial list and per-sport draft-read HTTP surfaces are gone. Public `matches` until Phase I. Match-drafts and match-workflow HTTP surfaces are already retired (#261–#262). OpenAPI `matches` tag no longer advertises the editorial list.

Historical behaviour: `GET /api/editor/matches` listed tennis and football matches for an editor or an admin, including drafts. Optional filters were `sport` (`tennis` or `football`), `status` (`draft`, `review`, or `published`), and `source` (`manual` or `import`). Newest `match_date` first, then `id`. Each item was `id`, `sport`, `competition`, `date`, `round`, `status`, `source`, and `label` (`Player A vs Player B` or `Home vs Away`). There was no club id and no stat count. `limit` defaulted to 20 and was 1–50. `offset` defaulted to 0. A bad query was HTTP 400. No token was HTTP 401 `Invalid token`. Any other signed role was HTTP 403 `Forbidden`. `GET /api/matches` stayed published-only.

`GET /api/editor/matches/tennis/:id` returned one tennis match for editing. The body matched what `POST /api/matches/tennis` accepted, including `stats` when stored, plus `status`. There was no percentage field. A football id or an unknown id was HTTP 404 `Unknown match`. No token was HTTP 401 `Invalid token`. OpenAPI marked the path with bearer security.

`GET /api/editor/matches/football/:id` returned one football match for editing. The body matched what `POST /api/matches/football` accepted, including `appearances` when stored, plus `status`. A tennis id or an unknown id was HTTP 404 `Unknown match`. No token was HTTP 401 `Invalid token`. OpenAPI marked the path with bearer security.

#### How to get to it (user POV)

HTTP routes are retired. Former routes (for history):

- `GET http://localhost:3001/api/editor/matches` with `Authorization: Bearer`.
- `GET http://localhost:3001/api/editor/matches/tennis/match-sample-qf` with `Authorization: Bearer` returned the seeded draft quarterfinal.
- `GET http://localhost:3001/api/editor/matches/football/match-sample-league` with `Authorization: Bearer` returned the seeded published league match.

Shapes on `GET /docs-json` no longer document those editorial paths. Swagger UI is `/docs`.

#### Driving it with verify

The verify CLI sends GET and does not send a bearer. `vp run verify:api --route /api/matches` checks the public list. Do not add `/api/editor/matches` or `/api/editor/matches/tennis/:id`. The editor-matches controller PGLite HTTP suite was removed in #263. Remaining API tests must pass without `editor-matches.controller.ts` or `features/editor-matches/`.

#### Gotchas

- Catalog tennis/football draft readers and seed draft rows remain until #186 / #268. A draft is still not on the public list.
- `source=import` was an empty page on the sample seed. Every seeded match was `manual`.
