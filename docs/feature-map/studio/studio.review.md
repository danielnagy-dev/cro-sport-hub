# studio.review: Review, reject, and publish

| App    | Status | Entry point (user POV)                     | Verify                                                             | Since         |
| ------ | ------ | ------------------------------------------ | ------------------------------------------------------------------ | ------------- |
| studio | live   | `http://localhost:4200/matches/:id/review` | `vp run studio#test`, `verify:studio --route`, and `verify:editor` | plan item 26a |

After login, `/matches/:id/review` loads `GET /api/editor/matches` to resolve the match id and sport, then `GET /api/editor/matches/<sport>/:id` for the draft only for that sport (so football ids never hit the tennis draft route). Editor lookups (`GET /api/editor/competitions`, `GET /api/editor/athletes`, and for football `GET /api/editor/teams`) resolve names for the screen.

The page shows label, sport, and status. Tennis also shows competition, date, round, both player names, each set score (including tiebreak detail on 7-6 sets), winner, and retirement when marked. Football also shows competition, date, round, both clubs, the score, and a appearances table (athlete, club, started, minutes, goals, assists, cards). Edit links to `/matches/:id/tennis` or `/matches/:id/football`. When the session role is admin and the status is `review`, Reject calls `POST /api/matches/:id/reject` and Publish calls `POST /api/matches/:id/publish`. An editor sees the details and Edit only. Success updates the status on the page. HTTP 409 shows the API message. A row not in review hides Reject and Publish. An unknown id shows `Match not found`.

#### Driving it with verify

- **Anonymous.** `vp run verify:studio --route /matches/match-sample-final/review` redirects to login without a session.
- **Proof.** `vp run studio#test` stubs HTTP for admin and editor sessions, reject, publish, conflict handling, tennis and football detail loading, and request order for football.
- **End-to-end.** `vp run verify:editor` starts the API, studio, and web, signs in with `EDITOR_DEMO_PASSWORD` and `ADMIN_DEMO_PASSWORD`, saves a tennis draft with sample players, submits, publishes, and expects those players on the public home page. Not in default CI. Needs Docker Compose and both demo passwords in the environment.
