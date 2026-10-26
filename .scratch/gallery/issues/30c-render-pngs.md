# 30c: Render gallery PNGs

**What to build:** An editor renders the stored slides to PNG bytes and reads one PNG back with the bearer token. This note is the spec.

**Blocked by:** 30b (`.scratch/gallery/issues/30b-create-gallery.md`). The slides and the caption already exist.

**Status:** ready-for-agent

**Size:** 280 counted lines. One bytea column, two routes, and a test that stores the renderer output. The HTML is 30a. The ZIP is 30e.

## Scope

In: `0008_v1_gallery_pngs.sql` adds a nullable `png` bytea on `gallery_slides`. Append it to the ordered migration list. Same rules as 30b: no `DO` block, `IF NOT EXISTS`, do not edit `0001`–`0005`, and do not put the renderer in `catalog.ts`.

`POST /api/galleries/:id/render` (editor or admin) calls `renderFootballPngs` on the stored slides, caption included, and saves the bytes. A later render overwrites them, so a caption edit is visible after the next render. The response is the slide count. Unknown gallery is HTTP 404 `Unknown gallery`.

`GET /api/galleries/:id/slides/:index.png` returns `image/png` for a rendered slide. The caller sends `Authorization: Bearer`. A slide with no bytes is HTTP 404 `Slide is not rendered`. There is no public image URL.

When Chromium is missing, the render route returns the library's existing reason (`footballRendererReason`) and does not invent a second message. A test without Chromium asserts that reason and skips the byte assertion, the same way the library skips. No new dependency. Playwright is already in the catalog. Chromium is installed with `vp exec playwright install chromium`.

Out: ZIP, submit, publish, and the studio preview. No ADR. Update `docs/feature-map.md` `api.gallery` with the render and PNG paths.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] After render, `GET` of slide `0` returns `image/png` and the stored bytes are non-empty.
- [ ] Before render, that `GET` is HTTP 404 `Slide is not rendered`.
- [ ] A caption saved in 30b is part of the HTML passed to the renderer on the next render.
- [ ] With Chromium absent, render reports `footballRendererReason` and writes no bytes.
- [ ] A missing token is HTTP 401 on both routes.

## Verification

PGLite HTTP suite. The byte assertion runs when Chromium is installed; otherwise the reason assertion is the result and the PR says so. `vp run verify:api` does not render. Say that in the results table.

## Architect

No. `renderFootballPngs` already owns rasterizing. This slice stores those bytes. No new dependency and no ADR.

### Seams

- `POST /render` and `GET` of the PNG on PGLite, with the renderer stubbed in the unit test. Catches a public URL, a render that ignores the caption, and a missing Chromium message that is not the library's.
