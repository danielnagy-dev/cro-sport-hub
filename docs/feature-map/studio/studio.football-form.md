# studio.football-form: Football match score form

| App    | Status | Entry point (user POV)                       | Verify                                           | Since         |
| ------ | ------ | -------------------------------------------- | ------------------------------------------------ | ------------- |
| studio | live   | `http://localhost:4200/matches/new/football` | `vp run studio#test` and `verify:studio --route` | plan item 25a |

After login, `/matches/new/football` loads editor lookup lists for football competitions and clubs, then saves a new draft with `POST /api/matches/football`. The body matches plan 11 for this slice: competition, date, round, both clubs, and goal counts only. There is no `status` and no `appearances`. Client validation uses the shared football schemas and shows each message beside the field. A successful save keeps the new match id on the page and leaves the form read-only. Appearance rows and submit for review are later plan items. There is no edit route or GET-by-id in this slice.

#### How to get to it (user POV)

- Log in at `http://localhost:4200/login`, then open `http://localhost:4200/matches/new/football`.
- Dev `ng serve` proxies `/api` to `http://localhost:3001`.

#### Driving it with verify

Preconditions: port 4200 is free. Playwright Chromium is installed. The verify CLI does not create a session.

- **Anonymous run.** `vp run verify:studio --route /matches/new/football` opens `/login` because `editorGuard` blocks the form.
- **Proof.** `vp run studio#test` stubs HTTP and covers validation, the draft body shape, same-club blocking, and a guest redirect. Live save needs the API.

#### Gotchas

- The matches table does not link here until a later plan item.
- Reopening a saved draft is plan 25c.
