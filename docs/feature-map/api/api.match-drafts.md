# api.match-drafts: Save tennis and football drafts

| App | Status  | Entry point (user POV)                   | Verify            | Since        |
| --- | ------- | ---------------------------------------- | ----------------- | ------------ |
| api | retired | `POST/PUT /api/matches/tennis,/football` | `vp run api#test` | plan item 11 |

**Retired (Phase H / #261–#262).** Controller unit spec deleted (#261). Nest controllers `match-drafts.controller.ts` / `match-workflow.controller.ts` and feature modules `features/match-drafts/` / `features/match-workflow/` deleted (#262). Folder auto-load no longer registers those modules, so draft write and submit/reject/publish HTTP surfaces are gone. Editor-matches HTTP and catalog draft readers are gone (#263–#264, #268). Catalog `drafts.ts` / `workflow.ts` writers deleted (#317). Seed no longer inserts legacy match rows (#319). Public `matches` until Phase I; physical table drop stays under #186 / Phase I. Studio match/form/review clients are already retired. OpenAPI `matches` tag no longer advertises draft saves or review transitions.

Historical behaviour: `POST /api/matches/tennis` and `POST /api/matches/football` created a match. `PUT` on that path plus an id replaced one. Both forced `status: draft`. An editor or admin sent `Authorization: Bearer`. No token was 401. Any other signed role was 403. The public `GET` routes stayed open. Tennis took a set score and optional raw stat counts. Football took a score and optional appearances. Percentage fields were rejected. The response was `{ id, status: "draft", sport }`.

#### How to get to it (user POV)

HTTP routes are retired. Former routes (for history):

- `POST http://localhost:3001/api/matches/tennis` or `/api/matches/football` with a bearer token. `PUT` added the match id.

Shapes on `GET /docs-json` no longer document those draft write paths. Swagger UI is `/docs`.

#### Driving it with verify

`vp run verify:api` proves the public reads and `/docs`. The match-drafts controller PGLite HTTP suite was removed in #261. Remaining API tests must pass without `match-drafts.controller.ts`, `match-workflow.controller.ts`, or their feature modules.

#### Gotchas

- Catalog `saveDraft` helpers are deleted (#317). Seed inserts no legacy match rows (#319). A draft is still not on the public list.
- `JWT_SECRET` was read on the draft route, not at boot. An edit replaced stats and appearances.
