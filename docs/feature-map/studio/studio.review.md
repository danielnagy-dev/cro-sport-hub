# studio.review: Review, reject, and publish

| App    | Status | Entry point (user POV)                     | Verify                                                             | Since         |
| ------ | ------ | ------------------------------------------ | ------------------------------------------------------------------ | ------------- |
| studio | live   | `http://localhost:4200/matches/:id/review` | `vp run studio#test`, `verify:studio --route`, and `verify:editor` | plan item 26a |

After login, `/matches/:id/review` resolves the row from `GET /api/editor/matches`, then loads only `GET /api/editor/matches/<sport>/:id` (no cross-sport draft). Lookups: `GET /api/editor/competitions`, `GET /api/editor/athletes`, and for football `GET /api/editor/teams`. The page shows label, sport, status, and sport-specific fields: tennis — competition, date, round, players, each set (tiebreak text), winner, retirement; football — same meta, clubs, score, appearances (incl. cards). Edit links to `/matches/:id/tennis` or `/matches/:id/football`. Admin + `review`: Reject `POST /api/matches/:id/reject`, Publish `POST /api/matches/:id/publish`. Editor sees details and Edit only. Success updates status; HTTP 409 shows API message; not-in-review hides actions; unknown id → `Match not found`.

#### Driving it with verify

- **Anonymous.** `vp run verify:studio --route /matches/match-sample-final/review` redirects to login without a session.
- **Proof.** `vp run studio#test` stubs HTTP (list-first, lookups, tennis/football order, admin/editor, reject/publish/409).
- **End-to-end.** `vp run verify:editor` starts the API, studio, and web, signs in with `EDITOR_DEMO_PASSWORD` and `ADMIN_DEMO_PASSWORD`, saves a tennis draft with sample players, submits, publishes, and expects those players on the public home page. Not in default CI. Needs Docker Compose and both demo passwords in the environment.
