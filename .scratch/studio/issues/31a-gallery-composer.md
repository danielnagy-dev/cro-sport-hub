# 31a: Studio gallery composer

**What to build:** An editor picks published football matches, creates a gallery, edits one caption per slide, and previews the PNG. This note is the spec.

**Blocked by:** 30c (`.scratch/gallery/issues/30c-render-pngs.md`) and 23a (`.scratch/editor/issues/23a-editor-match-list.md`). Create and render are 30b and 30c. The published list is 23a.

**Status:** ready-for-agent

**Size:** 320 counted lines. One composer page, a caption field per slide, and a preview that fetches the PNG with the bearer token. Review buttons are 31b.

## Scope

In: `/galleries/new`. The match picker lists published football matches from the 23a editorial list (`sport=football`, `status=published`). Create calls `POST /api/galleries` with those ids and opens the new gallery. Each slide shows one caption input bound to the 30b schema (`{ caption: string }` only). Saving sends `PATCH`. An empty input clears the caption. Preview calls `POST /render`, then fetches `GET .../slides/:index.png` with the bearer token and shows it through an object URL. An `img` tag does not send the bearer, so the page does not point `src` at the API. Studio does not import `libs/slide-generator` or `libs/ui`. A guest is sent to `/login`. Editors and admins both use the page.

Out: Reject, Publish, and ZIP (31b). No shirt-number field, no stat editor, no donut, no tennis match, and no social post. Extend `studio.gallery` in `docs/feature-map.md`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] The picker offers `match-sample-league` and does not offer a tennis match or a draft.
- [ ] Create navigates to the gallery. One caption input per slide. Saving `Sample night` sends `PATCH` with only `{ caption: "Sample night" }`.
- [ ] Preview fetches the PNG with the bearer token and displays the object URL. The template has no API URL in an `img` `src`.
- [ ] A guest is sent to `/login`.
- [ ] The studio project does not import `libs/slide-generator` or `libs/ui`.

## Verification

`vp run studio#test`. Verify without a session lands on login. A live PNG needs Chromium; otherwise record `not run` for the pixels and the reason. The stubbed fetch is still required.

## Architect

No. The routes and the caption schema are 30b and 30c. The page adds no dependency.

### Seams

- The composer, stubbed HTTP. Catches a tennis id in the picker, a caption body with a second field, and a preview that expects an `img` to send the bearer token.
