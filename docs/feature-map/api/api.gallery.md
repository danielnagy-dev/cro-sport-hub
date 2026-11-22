# api.gallery: Draft galleries, captions, render, PNG bytes, and review workflow

| App | Status       | Entry point (user POV)                                                | Verify              | Since       |
| --- | ------------ | --------------------------------------------------------------------- | ------------------- | ----------- |
| api | HTTP retired | `POST /api/galleries`, captions, render, PNG, submit, reject, publish | `vp run verify:api` | plan #52–54 |

**Phase H / #259.** Gallery Nest controller and feature module deleted (`gallery.controller.ts`, `gallery.module.ts`). Folder auto-load no longer registers a GalleryModule, so `/api/galleries` is gone. Service `gallery.ts` remains until #260; shared gallery types until #268; table drop is #186. Studio gallery UI is already retired (`studio.gallery`). Controller unit specs were removed in #258.

Editors and admins previously created draft football galleries from published match ids, read the draft, and patched slide captions. `POST /api/galleries/:id/render` rasterized stored slides (caption included) with the slide-generator Chromium renderer and saved PNG bytes on each row. A later render overwrote bytes. The JSON body was `{ slideCount }`. Unknown gallery was HTTP 404 `Unknown gallery`. When Chromium was not installed, render was HTTP 503 with the message from `footballRendererReason` and no bytes were written. The football list template paginates after **four** appearances in one round so rows stay above the brand footer at 1080×1350; further appearances in that round continue on additional **list** slides (a lone fifth row is still `kind: "list"` with one player).

New editorial callers render slides from an ordered appearance payload without a gallery entity: `slidesFromAppearance` / `renderAppearancePngs` on `@cro-sport-hub/slide-generator` (ADR-003 Phase G). The payload includes `sportSlug`: football keeps the round-13 template; tennis and basketball use intentional text-forward MVP placeholders (1080×1350) until a design pass. Gallery create still maps match appearances through `catalogSlides` + `footballSlides` in the remaining service. ZIP download was the retired gallery path (ADR-006 / Phase H).

`GET /api/galleries/:id/slides/:index.png` returned `image/png` for one rendered slide. The caller sent `Authorization: Bearer`. There was no public image URL. A slide with no PNG bytes was HTTP 404 `Slide is not rendered`. Missing or invalid bearer token was HTTP 401 `Invalid token` on render and on the PNG route.

`POST /api/galleries/:id/submit` moved a draft to review. An editor or an admin sent `Authorization: Bearer`. The response was HTTP 200 `{ id, status: "review" }`. The row did not gain `reviewedBy` or `publishedAt`. `POST /api/galleries/:id/reject` was admin only. The row must have been in review. It became draft, and `reviewedBy` and `publishedAt` were cleared. The response was HTTP 200 `{ id, status: "draft" }`. `POST /api/galleries/:id/publish` was admin only. The row must have been in review. It became published, `reviewedBy` was the caller, and `publishedAt` was an ISO timestamp with a numeric offset. The response was HTTP 200 `{ id, status: "published" }`. PNG bytes were not required to publish. These three routes did not call `invalidatePublicReads`. A missing token was HTTP 401 `Invalid token`. An editor calling reject or publish was HTTP 403 `Forbidden`. Submit of any other status was HTTP 409 `Only a draft gallery can be submitted`. Reject or publish of any other status was HTTP 409 with the matching message. An unknown id was HTTP 404 `Unknown gallery`.

`GET /api/galleries/:id/download` returned `application/zip` when status was `published` and every slide had PNG bytes. The caller sent `Authorization: Bearer`. Entries were `01.png`, `02.png`, in `slide_index` order. Any other status was HTTP 409 `Only an approved gallery can be downloaded`. A published gallery with a missing PNG was HTTP 409 `Gallery slides are not rendered` and returned no partial archive. Unknown id was HTTP 404 `Unknown gallery`. Missing or invalid bearer token was HTTP 401 `Invalid token`.

#### How to get to it (user POV)

HTTP routes are retired. Service helpers in `apps/api/src/features/gallery/gallery.ts` remain until #260. Former routes (for history):

- Create: `POST http://localhost:3001/api/galleries` with `{ "matchIds": ["…"] }`.
- Read: `GET http://localhost:3001/api/galleries/{id}`.
- Caption: `PATCH http://localhost:3001/api/galleries/{id}/slides/{index}` with `{ "caption": "…" }`.
- Render: `POST http://localhost:3001/api/galleries/{id}/render`.
- PNG: `GET http://localhost:3001/api/galleries/{id}/slides/0.png`.
- Submit: `POST http://localhost:3001/api/galleries/{id}/submit`.
- Reject: `POST http://localhost:3001/api/galleries/{id}/reject`.
- Publish: `POST http://localhost:3001/api/galleries/{id}/publish`.
- Download ZIP: `GET http://localhost:3001/api/galleries/{id}/download`.

Shapes on `GET /docs-json` no longer include a `galleries` tag. Swagger UI is `/docs`.

#### Driving it with verify

Preconditions: same as `api.health`. Migrations run on the first request.

- **OpenAPI.** `vp run verify:api` saves `openapi.json`. Gallery paths must be absent.
- **Behaviour.** Controller and PGLite HTTP suite are gone (#258–#259). Service remains until #260.

#### Gotchas

- Render needed Playwright Chromium (`vp exec playwright install chromium`). CI often skipped byte assertions when the binary was absent.
- Caption text is stored separately from the slide JSON; render merges the caption into the HTML passed to the template.
- PNG bytes live in the catalog database, not on a CDN or static path.
