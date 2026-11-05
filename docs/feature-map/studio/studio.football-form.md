# studio.football-form: Football match score form

| App    | Status | Entry point (user POV)                       | Verify                                           | Since         |
| ------ | ------ | -------------------------------------------- | ------------------------------------------------ | ------------- |
| studio | live   | `http://localhost:4200/matches/new/football` | `vp run studio#test` and `verify:studio --route` | plan item 25a |

Log in, open `/matches/new/football`, choose competition, date, round, clubs, and goals, then save a draft with `POST /api/matches/football` (no `status` key). Optional appearance rows pick a football athlete, one of the two clubs, and the shared appearance counts; the body includes `appearances` only when at least one row is present. `/matches/:id/football` loads the same form from `GET /api/editor/matches/football/:id` and saves with `PUT /api/matches/football/:id`. The PUT body includes appearances when the form has rows and does not include `status`. An unknown id shows `Match not found`. Submit for review calls `POST /api/matches/:id/submit` after a successful save. Shared football schemas drive validation. A successful create keeps the id on the page and locks the form. On the edit route, a draft stays editable until the status is no longer `draft`. The matches table links a football row to `/matches/:id/football`.

#### How to get to it (user POV)

- Log in at `http://localhost:4200/login`, then open `http://localhost:4200/matches/new/football` or `http://localhost:4200/matches/match-sample-league/football`.
- From the matches table, open a football row label link.

#### Driving it with verify

- **Anonymous.** `vp run verify:studio --route /matches/new/football` lands on `/login`.
- **Proof.** `vp run studio#test` stubs HTTP for validation, appearances, submit, and reopening a draft with PUT. Verify has no bearer, so it cannot prove the editor GET.

#### Gotchas

- A published or review row opens on this route and stays locked. Only a draft can be saved again.
