# 30d: Submit, reject, and publish a gallery

**What to build:** An editor submits a draft gallery. An admin rejects it back to draft or publishes it. Publishing does not require PNGs and does not touch the public match cache. This note is the spec.

**Blocked by:** 30b (`.scratch/gallery/issues/30b-create-gallery.md`). The draft row is that slice. The match routes in 12a and 12b are a separate workflow. Do not call them.

**Status:** ready-for-agent

**Size:** 260 counted lines. Three admin routes and the status tests. The screen is 31b. The ZIP waits for published plus PNGs (30e).

## Scope

In: `POST /api/galleries/:id/submit` (editor or admin) moves `draft` to `review` and does not set a reviewer. `POST /api/galleries/:id/reject` (admin) moves `review` to `draft` and clears `reviewed_by` and `published_at`. `POST /api/galleries/:id/publish` (admin) moves `review` to `published`, sets `reviewed_by` to the caller, and sets `published_at` to an ISO timestamp with a numeric offset.

Wrong status is HTTP 409: `Only a draft gallery can be submitted`, `Only a gallery in review can be rejected`, `Only a gallery in review can be published`. An editor token on reject or publish is HTTP 403 `Forbidden`. A missing token is HTTP 401 `Invalid token`. Unknown id is HTTP 404 `Unknown gallery`. OpenAPI marks the three paths with bearer security.

These routes do not call `invalidatePublicReads`. A gallery is not a public read. PNGs are not required to publish.

Out: the studio buttons (31b), the ZIP (30e), and any public gallery page. No new dependency and no ADR. Update `docs/feature-map.md` `api.gallery` with the three paths.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] An editor submits a draft. The status is `review` and `reviewed_by` is empty.
- [ ] An admin publishes that review. `reviewed_by` is the admin and `published_at` has a numeric offset. A second publish is HTTP 409.
- [ ] An admin reject of a review returns the gallery to `draft` with no reviewer and no `published_at`.
- [ ] An editor token is HTTP 403 on publish and on reject.
- [ ] Publishing does not delete `pub:v1:` keys.

## Verification

PGLite HTTP suite. `vp run verify:api` does not send an admin token. Say that in the results table.

## Architect

No. `EditorGuard` and `AdminGuard` are on main. The status rules match the match workflow and stay on these routes.

### Seams

- Submit, reject, and publish on PGLite. Catches an editor who publishes, a publish that requires a PNG, and a publish that clears the public match cache.
