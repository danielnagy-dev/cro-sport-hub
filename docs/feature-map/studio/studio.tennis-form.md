# studio.tennis-form: Tennis match form with stats

| App    | Status | Entry point (user POV)                     | Verify                                           | Since         |
| ------ | ------ | ------------------------------------------ | ------------------------------------------------ | ------------- |
| studio | live   | `http://localhost:4200/matches/new/tennis` | `vp run studio#test` and `verify:studio --route` | plan item 24b |

After login, `/matches/new/tennis` loads editor lookup lists for competitions and tennis players, then saves a new draft with `POST /api/matches/tennis`. The body matches plan 11: set score fields only, no `status`, no `stats`, and no percentage fields. Client validation uses the shared tennis schemas and shows each message beside the field. A successful save keeps the new match id on the page for plan 24c. There is no edit route or GET-by-id in this slice.

#### How to get to it (user POV)

- Log in at `http://localhost:4200/login`, then open `http://localhost:4200/matches/new/tennis`.
- Dev `ng serve` proxies `/api` to `http://localhost:3001`.

#### Driving it with verify

Preconditions: port 4200 is free. Playwright Chromium is installed. The verify CLI does not create a session.

- **Anonymous run.** `vp run verify:studio --route /matches/new/tennis` opens `/login` because `editorGuard` blocks the form.
- **Proof.** `vp run studio#test` stubs HTTP and covers validation, a successful create that keeps the id on the page, and a guest redirect. Live save needs the API.

#### Gotchas

- The matches table does not link here until plan 24d.
- Stat counts and submit for review are plan 24c, not this route.
