# studio.review: Review, reject, and publish

| App    | Status   | Entry point (user POV)                                          | Verify               | Since                          |
| ------ | -------- | --------------------------------------------------------------- | -------------------- | ------------------------------ |
| studio | retiring | `http://localhost:4200/matches/:id/review` (route unregistered) | `vp run studio#test` | plan item 26a; Phase H (`H5a`) |

**Retired (H5a):** `apps/studio/src/app/feature/review/review.spec.ts` is deleted. The `/matches/:id/review` route is unregistered in `app.routes.ts` (#240); deep links hit the `**` → Početna redirect and do not lazy-load this module. Feature sources (`review.ts`, `review.html`, `review.routes.ts`) and `core/review-api.ts` remain on disk until H5b (#250).

Historical behaviour (while the folder remains): after login, `/matches/:id/review` resolved the row from `GET /api/editor/matches`, then loaded only `GET /api/editor/matches/<sport>/:id` (no cross-sport draft). Lookups: `GET /api/editor/competitions`, `GET /api/editor/athletes`, and for football `GET /api/editor/teams`. The page showed label, sport, status, and sport-specific fields: tennis — competition, date, round, players, each set (tiebreak text), winner, retirement; football — same meta, clubs, score, appearances (incl. cards). Edit linked to `/matches/:id/tennis` or `/matches/:id/football`. Admin + `review`: Reject `POST /api/matches/:id/reject`, Publish `POST /api/matches/:id/publish`. Editor saw details and Edit only. Success updated status; HTTP 409 showed API message; not-in-review hid actions; unknown id → `Match not found`.

#### Driving it with verify

- **Anonymous / deep link.** `vp run verify:studio --route /matches/match-sample-final/review` no longer loads the review feature; the path redirects toward Početna (then login without a session).
- **Proof.** Studio unit coverage for this page lived in the deleted `review.spec.ts`. Remaining Studio tests must pass without that file.
- **End-to-end.** Legacy `vp run verify:editor` match-draft publish flow is out of Phase H; editorial publish is Početna / Objave (Phase F/G).
