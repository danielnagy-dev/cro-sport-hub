# api.gallery: Draft galleries, captions, render, and PNG bytes

| App | Status | Entry point (user POV)                                                       | Verify              | Since       |
| --- | ------ | ---------------------------------------------------------------------------- | ------------------- | ----------- |
| api | live   | `POST /api/galleries`, captions, `POST …/render`, `GET …/slides/{index}.png` | `vp run verify:api` | plan #52–53 |

Editors and admins create draft football galleries from published match ids, read the draft, and patch slide captions. `POST /api/galleries/:id/render` rasterizes stored slides (caption included) with the slide-generator Chromium renderer and saves PNG bytes on each row. A later render overwrites bytes. The JSON body is `{ slideCount }`. Unknown gallery is HTTP 404 `Unknown gallery`. When Chromium is not installed, render is HTTP 503 with the message from `footballRendererReason` and no bytes are written.

`GET /api/galleries/:id/slides/:index.png` returns `image/png` for one rendered slide. The caller sends `Authorization: Bearer`. There is no public image URL. A slide with no PNG bytes is HTTP 404 `Slide is not rendered`. Missing or invalid bearer token is HTTP 401 `Invalid token` on render and on the PNG route.

#### How to get to it (user POV)

- Create: `POST http://localhost:3001/api/galleries` with `{ "matchIds": ["…"] }`.
- Read: `GET http://localhost:3001/api/galleries/{id}`.
- Caption: `PATCH http://localhost:3001/api/galleries/{id}/slides/{index}` with `{ "caption": "…" }`.
- Render: `POST http://localhost:3001/api/galleries/{id}/render`.
- PNG: `GET http://localhost:3001/api/galleries/{id}/slides/0.png`.

Shapes are on `GET /docs-json`. Swagger UI is `/docs`.

#### Driving it with verify

Preconditions: same as `api.health`. Migrations run on the first request.

- **OpenAPI.** `vp run verify:api` saves `openapi.json`. It does not call render or download PNG bytes.
- **Behaviour.** The PGLite HTTP suite in `apps/api` covers create, caption, render (stubbed renderer when Chromium is present), PNG bytes, missing Chromium, and auth.

#### Gotchas

- Render needs Playwright Chromium (`vp exec playwright install chromium`). CI often skips byte assertions when the binary is absent.
- Caption text is stored separately from the slide JSON; render merges the caption into the HTML passed to the template.
- PNG bytes live in the catalog database, not on a CDN or static path.
