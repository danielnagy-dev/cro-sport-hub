# api.gallery: Draft galleries, captions, render, PNG bytes, and review workflow

| App | Status | Entry point (user POV)                                                | Verify              | Since       |
| --- | ------ | --------------------------------------------------------------------- | ------------------- | ----------- |
| api | live   | `POST /api/galleries`, captions, render, PNG, submit, reject, publish | `vp run verify:api` | plan #52–54 |

Editors and admins create draft football galleries from published match ids, read the draft, and patch slide captions. `POST /api/galleries/:id/render` rasterizes stored slides (caption included) with the slide-generator Chromium renderer and saves PNG bytes on each row. A later render overwrites bytes. The JSON body is `{ slideCount }`. Unknown gallery is HTTP 404 `Unknown gallery`. When Chromium is not installed, render is HTTP 503 with the message from `footballRendererReason` and no bytes are written.

`GET /api/galleries/:id/slides/:index.png` returns `image/png` for one rendered slide. The caller sends `Authorization: Bearer`. There is no public image URL. A slide with no PNG bytes is HTTP 404 `Slide is not rendered`. Missing or invalid bearer token is HTTP 401 `Invalid token` on render and on the PNG route.

`POST /api/galleries/:id/submit` moves a draft to review. An editor or an admin sends `Authorization: Bearer`. The response is HTTP 200 `{ id, status: "review" }`. The row does not gain `reviewedBy` or `publishedAt`. `POST /api/galleries/:id/reject` is admin only. The row must be in review. It becomes draft, and `reviewedBy` and `publishedAt` are cleared. The response is HTTP 200 `{ id, status: "draft" }`. `POST /api/galleries/:id/publish` is admin only. The row must be in review. It becomes published, `reviewedBy` is the caller, and `publishedAt` is an ISO timestamp with a numeric offset. The response is HTTP 200 `{ id, status: "published" }`. PNG bytes are not required to publish. These three routes do not call `invalidatePublicReads`. A missing token is HTTP 401 `Invalid token`. An editor calling reject or publish is HTTP 403 `Forbidden`. Submit of any other status is HTTP 409 `Only a draft gallery can be submitted`. Reject or publish of any other status is HTTP 409 with the matching message. An unknown id is HTTP 404 `Unknown gallery`.

`GET /api/galleries/:id/download` returns `application/zip` when status is `published` and every slide has PNG bytes. The caller sends `Authorization: Bearer`. Entries are `01.png`, `02.png`, in `slide_index` order. Any other status is HTTP 409 `Only an approved gallery can be downloaded`. A published gallery with a missing PNG is HTTP 409 `Gallery slides are not rendered` and returns no partial archive. Unknown id is HTTP 404 `Unknown gallery`. Missing or invalid bearer token is HTTP 401 `Invalid token`.

#### How to get to it (user POV)

- Create: `POST http://localhost:3001/api/galleries` with `{ "matchIds": ["…"] }`.
- Read: `GET http://localhost:3001/api/galleries/{id}`.
- Caption: `PATCH http://localhost:3001/api/galleries/{id}/slides/{index}` with `{ "caption": "…" }`.
- Render: `POST http://localhost:3001/api/galleries/{id}/render`.
- PNG: `GET http://localhost:3001/api/galleries/{id}/slides/0.png`.
- Submit: `POST http://localhost:3001/api/galleries/{id}/submit`.
- Reject: `POST http://localhost:3001/api/galleries/{id}/reject`.
- Publish: `POST http://localhost:3001/api/galleries/{id}/publish`.
- Download ZIP: `GET http://localhost:3001/api/galleries/{id}/download`.

Shapes are on `GET /docs-json`. Swagger UI is `/docs`.

#### Driving it with verify

Preconditions: same as `api.health`. Migrations run on the first request.

- **OpenAPI.** `vp run verify:api` saves `openapi.json`. It does not call render or download PNG bytes.
- **Behaviour.** The PGLite HTTP suite in `apps/api` covers create, caption, render (stubbed renderer when Chromium is present), PNG bytes, missing Chromium, auth, submit, reject, publish (including that publish does not clear `pub:v1:` cache keys), and ZIP download of published galleries with rendered slides.

#### Gotchas

- Render needs Playwright Chromium (`vp exec playwright install chromium`). CI often skips byte assertions when the binary is absent.
- Caption text is stored separately from the slide JSON; render merges the caption into the HTML passed to the template.
- PNG bytes live in the catalog database, not on a CDN or static path.
