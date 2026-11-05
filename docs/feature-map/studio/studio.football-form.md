# studio.football-form: Football match score form

| App    | Status | Entry point (user POV)                       | Verify                                           | Since         |
| ------ | ------ | -------------------------------------------- | ------------------------------------------------ | ------------- |
| studio | live   | `http://localhost:4200/matches/new/football` | `vp run studio#test` and `verify:studio --route` | plan item 25a |

Log in, open `/matches/new/football`, choose competition, date, round, clubs, and goals, then save a draft with `POST /api/matches/football` (no `status` key). Optional appearance rows pick a football athlete, one of the two clubs, and the shared appearance counts; the body includes `appearances` only when at least one row is present. `/matches/:id/football` loads the same form from `GET /api/editor/matches/football/:id` and saves changes with `PUT /api/matches/football/:id`. Submit for review calls `POST /api/matches/:id/submit` after a successful save. Shared football schemas drive validation. A successful create keeps the id on the page and locks the form. On the edit route, a draft stays editable until save. An unknown id shows `Match not found`. The matches table links football rows to `/matches/:id/football`.

#### Driving it with verify

- **Anonymous.** `vp run verify:studio --route /matches/new/football` lands on `/login`.
- **Proof.** `vp run studio#test` stubs HTTP for validation, appearances, edit load, and submit. Verify has no bearer.

#### Gotchas

- Published or review matches open read-only on the edit route until status returns to draft after save.
