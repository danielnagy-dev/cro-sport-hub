# 26a: Review, reject, and publish

**What to build:** A match in review can be edited, rejected, or published from one studio screen. Publish and reject are admin actions. This note is the spec.

**Blocked by:** 12b (`.scratch/matches/issues/12b-publish.md`), 24d (`.scratch/studio/issues/24d-tennis-edit.md`), 25c (`.scratch/studio/issues/25c-football-edit.md`), and 23b. Edit links need both edit routes. `adminGuard` is on main (plan 22, PR #23).

**Status:** ready-for-agent

**Size:** 300 counted lines. One screen and three actions. The forms and the transition routes are already separate tickets.

## Scope

In: `/matches/:id/review`, behind `editorGuard`. It loads `GET /api/editor/matches/tennis/:id` or the football twin from 24d and 25c, and shows the label, sport, and status. Edit links to `/matches/:id/tennis` or `/matches/:id/football`. When the session role is admin and the status is `review`, Reject calls `POST /api/matches/:id/reject` and Publish calls `POST /api/matches/:id/publish`. An editor sees the summary and the Edit link, and does not see Reject or Publish. Success shows the new status. A 409 shows the API message. A row that is not in review hides both buttons. An unknown id shows `Match not found`.

Out: the cross-app Playwright flow (26b) and gallery approval. Update `docs/feature-map.md` `studio.review`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] An admin looking at a review row can reject it. The stubbed reject returns `draft` and the screen shows `draft`.
- [ ] An admin can publish. The screen shows `published`.
- [ ] An editor token does not render Reject or Publish. Edit still goes to the sport form.
- [ ] A draft row hides both buttons. A 409 from publish shows `Only a match in review can be published`. An unknown id shows `Match not found`.

## Verification

`vp run studio#test`. `vp run verify:studio --route /matches/match-sample-final/review` redirects to login without a session. The buttons are the unit test.

## Architect

No. The routes are 12a and 12b. The role comes from the plan 22 session. The screen adds no schema.

### Seams

- The review screen, stubbed HTTP, for an admin session and an editor session. Catches an editor who can publish, and a draft row that shows Publish.
