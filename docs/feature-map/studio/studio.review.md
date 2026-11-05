# studio.review: Review, reject, and publish

| App    | Status | Entry point (user POV)                     | Verify                                                             | Since         |
| ------ | ------ | ------------------------------------------ | ------------------------------------------------------------------ | ------------- |
| studio | live   | `http://localhost:4200/matches/:id/review` | `vp run studio#test`, `verify:studio --route`, and `verify:editor` | plan item 26a |

After login, `/matches/:id/review` loads the tennis or football editor read for that id, then the editorial list row for the label. The page shows label, sport, and status. Edit links to `/matches/:id/tennis` or `/matches/:id/football`. When the session role is admin and the status is `review`, Reject calls `POST /api/matches/:id/reject` and Publish calls `POST /api/matches/:id/publish`. An editor sees the summary and Edit only. Success updates the status on the page. HTTP 409 shows the API message. A row not in review hides Reject and Publish. An unknown id shows `Match not found`.

#### Driving it with verify

- **Anonymous.** `vp run verify:studio --route /matches/match-sample-final/review` redirects to login without a session.
- **Proof.** `vp run studio#test` stubs HTTP for admin and editor sessions, reject, publish, and conflict handling.
- **End-to-end.** `vp run verify:editor` starts the API, studio, and web, signs in with `EDITOR_DEMO_PASSWORD` and `ADMIN_DEMO_PASSWORD`, saves a tennis draft with sample players, submits, publishes, and expects those players on the public home page. Not in default CI. Needs Docker Compose and both demo passwords in the environment.
