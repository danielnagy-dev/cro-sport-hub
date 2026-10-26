# 31b: Gallery review and ZIP download

**What to build:** An admin rejects or publishes a gallery in review. An editor or an admin downloads the ZIP once it is published. This note is the spec.

**Blocked by:** 31a (`.scratch/studio/issues/31a-gallery-composer.md`), 30d (`.scratch/gallery/issues/30d-gallery-review.md`), 30e (`.scratch/gallery/issues/30e-gallery-zip.md`), and 26a (`.scratch/studio/issues/26a-review-screen.md`). Plan 31 follows the match review screen. The buttons call 30d and 30e.

**Status:** ready-for-agent

**Size:** 280 counted lines. Review actions and a download button on the gallery page. The composer is 31a.

## Scope

In: `/galleries/:id`. It loads `GET /api/galleries/:id`. An admin on a `review` gallery sees Reject and Publish. Those call `POST .../reject` and `POST .../publish`. An editor does not see them. A `draft` hides both. After publish, Download calls `GET .../download` with the bearer token and saves the ZIP. Download is hidden unless the status is `published`. Unknown id shows `Gallery not found`. A guest is sent to `/login`.

Out: social posting and a public gallery page. Extend `studio.gallery` in `docs/feature-map.md`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] An admin on a review gallery sees Reject and Publish. An editor on that gallery sees neither.
- [ ] A draft shows neither button. Publish on a review gallery calls `POST .../publish`.
- [ ] Download is shown only when the status is `published`, and the request sends the bearer token.
- [ ] An unknown id shows `Gallery not found`.
- [ ] The page does not post to a social network.

## Verification

`vp run studio#test`. Verify without a session lands on login.

## Architect

No. The routes are 30d and 30e. The role split matches 26a.

### Seams

- The gallery page, stubbed HTTP. Catches an editor who sees Publish, a download button on a draft, and a request that omits the bearer token.
