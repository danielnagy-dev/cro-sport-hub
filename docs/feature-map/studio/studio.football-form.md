# studio.football-form: Football match score form

| App    | Status | Entry point (user POV)                       | Verify                                           | Since         |
| ------ | ------ | -------------------------------------------- | ------------------------------------------------ | ------------- |
| studio | live   | `http://localhost:4200/matches/new/football` | `vp run studio#test` and `verify:studio --route` | plan item 25a |

Log in, open `/matches/new/football`, choose competition, date, round, clubs, and goals, then save a draft with `POST /api/matches/football` (no `status` or `appearances`). Shared football schemas drive validation. A successful save keeps the id on the page and locks the form.

#### Driving it with verify

- **Anonymous.** `vp run verify:studio --route /matches/new/football` lands on `/login`.
- **Proof.** `vp run studio#test` stubs HTTP for validation and the draft body.

#### Gotchas

- The matches table does not link here yet.
