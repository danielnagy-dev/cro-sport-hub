# 30e: Download an approved gallery as a ZIP

**What to build:** An editor or an admin downloads the PNGs of a published gallery as one ZIP, in slide order. This note is the spec.

**Blocked by:** 30c (`.scratch/gallery/issues/30c-render-pngs.md`) and 30d (`.scratch/gallery/issues/30d-gallery-review.md`). The bytes and the published status are those slices.

**Status:** ready-for-agent

**Size:** 220 counted lines. One download route, a pure-JS ZIP dependency, ADR-006, and a test that reads the entries. The studio button is 31b.

## Scope

In: a pure-JS ZIP library with no install script and no new `allowBuilds` entry. The architect picks the package and writes ADR-006 in this pull request. Do not hand-roll the ZIP format. Status becomes Accepted there.

`GET /api/galleries/:id/download` (editor or admin) returns the ZIP when status is `published` and every slide has PNG bytes. Entries are `01.png`, `02.png`, in `slide_index` order. Any other status is HTTP 409 `Only an approved gallery can be downloaded`. A published gallery with a missing PNG is HTTP 409 `Gallery slides are not rendered` and returns no partial archive. Unknown id is HTTP 404 `Unknown gallery`. A missing token is HTTP 401 `Invalid token`. OpenAPI marks the path with bearer security. The response is not a public URL.

Out: social posting, a public gallery page, and a studio control. Update `docs/feature-map.md` `api.gallery` with the download path.

## Order

Plan is this note. Architect writes ADR-006 and names the package. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] Download of a published gallery with two rendered slides returns a ZIP whose entries are `01.png` and `02.png` in that order, and the bytes match the stored PNGs.
- [ ] A draft, a review, and a published gallery with a missing PNG do not return an archive. The published-but-empty case is HTTP 409 `Gallery slides are not rendered`. The other statuses are HTTP 409 `Only an approved gallery can be downloaded`.
- [ ] An editor token can download a published gallery. A missing token is HTTP 401.
- [ ] ADR-006 is Accepted. The PR adds no `allowBuilds` entry.

## Verification

PGLite HTTP suite with stubbed PNG bytes. Building the ZIP does not need Chromium. `vp run verify:api` does not download. Say that in the results table.

## Architect

Yes. New runtime dependency, so this pull request needs ADR-006.

### Seams

- `GET /api/galleries/:id/download` on PGLite. Catches a draft that downloads, a ZIP whose order is not `slide_index`, and a partial archive.
