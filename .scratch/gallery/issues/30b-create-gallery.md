# 30b: Create a gallery and edit captions

**What to build:** An editor creates a draft gallery from published football matches and sets one optional caption on each slide. This note is the spec.

**Blocked by:** 30a (`.scratch/gallery/issues/30a-catalog-slides.md`). Slides come from that mapper.

**Status:** ready-for-agent

**Size:** 340 counted lines. One migration, a caption schema, three editor routes, and the create tests. PNG bytes are 30c. Submit and publish are 30d.

## Scope

In: `0007_v1_galleries.sql`. Do not use the name `0006_v1_import_runs.sql` (14a owns it). Append `0007` to the ordered migration list. Statements may be split on semicolons. No `DO` block. `IF NOT EXISTS`. Do not edit `0001`–`0005`. Gallery logic does not go in `catalog.ts`; that file is over the file-size guard and a separate pull request is splitting it. Touch the migration list only.

`galleries` stores `id`, `status`, `created_by`, nullable `reviewed_by`, nullable `published_at`, and `created_at`. `gallery_slides` stores `gallery_id`, `slide_index`, `match_id`, `caption`, and a `payload` snapshot of the mapped entry from 30a. Status uses the existing `draft` / `review` / `published` enum. A new gallery is `draft`. `created_by` is the caller.

`POST /api/galleries` body `{ matchIds: string[] }` with at least one id. An empty list is HTTP 400 `Pick a published football match`. Every id is a published football match. A draft, a review, a tennis match, or an unknown id is HTTP 400 `Only a published football match can be added`. A repeated id is HTTP 400 `Match is listed twice`. Any of those stores nothing. Slides are the 30a mapper in appearance order, grouped by the existing `footballSlides`. Captions start empty. The response is the gallery id and the slide indexes.

`GET /api/galleries/:id` returns `id`, `status`, and slides in index order: index, match id, caption (empty string when unset), and the text stats. Unknown id is HTTP 404 `Unknown gallery`.

`PATCH /api/galleries/:id/slides/:index` body is a strict object `{ caption: string }` and nothing else. The string is at most 500 characters. Empty stores no caption. Unknown index is HTTP 404 `Unknown slide`. Shared types export that one-field schema. Studio does not invent a second shape.

Editor or admin (`EditorGuard`). A missing token is HTTP 401 `Invalid token`. OpenAPI marks the three paths with bearer security. There is no public gallery route.

Out: PNG bytes, submit, reject, publish, ZIP, studio pages, social posting, and a shirt-number field. No new dependency and no ADR. Update `docs/feature-map.md` with `api.gallery`.

## Order

Plan is this note. Architect sketches the create signature below. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] An editor posts `match-sample-league` and reads a draft back. The slide list is one list slide, Karlo Brkić has no shirt number, and every caption is empty.
- [ ] A tennis id, a draft football id, an empty list, and a repeated id are each HTTP 400 and store nothing. The empty list says `Pick a published football match`. The repeated id says `Match is listed twice`.
- [ ] `PATCH` with `{ caption: "Sample night" }` on slide `0` returns that caption from `GET`. `PATCH` with `{ caption: "" }` clears it. A second field is rejected.
- [ ] A missing token is HTTP 401. `/docs-json` has no public gallery path.

## Verification

PGLite HTTP suite. `vp run verify:api` does not send an editor token. Say that in the results table.

## Architect

Yes. New tables and a shared caption schema. No ADR and no new dependency. The 30a mapper stays the slide builder.

`createGallery(catalog, matchIds, actorId)` returns the draft. The HTTP handler is the editor seam.

### Seams

- `createGallery` on PGLite. Catches a tennis id that stored a row, and a slide that invented a shirt number.
- `PATCH` caption. Catches a second field, and a caption that does not survive a later `GET`.
