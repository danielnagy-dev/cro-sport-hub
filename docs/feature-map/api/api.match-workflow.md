# api.match-workflow: Submit, reject, and publish

| App | Status  | Entry point (user POV)                           | Verify            | Since         |
| --- | ------- | ------------------------------------------------ | ----------------- | ------------- |
| api | retired | `POST /api/matches/{id}/submit,/reject,/publish` | `vp run api#test` | plan item 12a |

**Retired (Phase H / #262).** Nest controller `match-workflow.controller.ts` and feature module `features/match-workflow/` deleted with match-drafts (#262). Folder auto-load no longer registers a MatchWorkflowModule, so submit/reject/publish HTTP surfaces are gone. Editor-matches stays until #263/#264; public `matches` until Phase I; catalog workflow helpers and table drop are #186. Studio review UI is already retired (`studio.review`). OpenAPI `matches` tag no longer advertises review transitions.

Historical behaviour: `POST /api/matches/{id}/submit` moved a draft to review. An editor or an admin sent `Authorization: Bearer`. The response was HTTP 200 `{ id, status: "review" }`. The row did not gain `reviewedBy` or `publishedAt`. `POST /api/matches/{id}/reject` was admin only. The row had to be in review. It became draft, and `reviewedBy` and `publishedAt` were cleared. The response was HTTP 200 `{ id, status: "draft" }`. `POST /api/matches/{id}/publish` was admin only. The row had to be in review. It became `published`, `reviewedBy` was the caller id, and `publishedAt` was the current time with a numeric offset. The response was HTTP 200 `{ id, status: "published" }`. After a successful publish, public Redis keys from plan item 9b were cleared. A hook error did not change the HTTP status of a transition that already committed. A missing token was HTTP 401 `Invalid token`. An editor calling reject or publish was HTTP 403 `Forbidden`. Submit of any other status was HTTP 409 `Only a draft can be submitted`. Reject of any other status was HTTP 409 `Only a match in review can be rejected`. Publish of any other status was HTTP 409 `Only a match in review can be published`. An unknown id was HTTP 404 `Unknown match`. `GET /api/matches` stayed public, and a match in review was not on that list until it was published.

#### How to get to it (user POV)

HTTP routes are retired. Former routes (for history):

- `POST http://localhost:3001/api/matches/{id}/submit`, `/reject`, or `/publish` with a bearer token.

Shapes on `GET /docs-json` no longer document those transition paths. Swagger UI is `/docs`.

#### Driving it with verify

`vp run verify:api` stays on the public GETs and does not publish a match. The PGLite HTTP suite for transitions was removed with the match-drafts controller specs (#261). Remaining API tests must pass without `match-workflow.controller.ts` or `features/match-workflow/`.

#### Gotchas

- Catalog `submitMatch` / `rejectMatch` / `publishMatch` helpers remain until a later catalog ticket. Reject or publish of a draft or a published row was HTTP 409; those routes did not demote a published row.
- Nest's POST default was 201; these routes set HTTP 200.
