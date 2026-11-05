# studio.matches: Matches list with filters

| App    | Status | Entry point (user POV)          | Verify                                   | Since         |
| ------ | ------ | ------------------------------- | ---------------------------------------- | ------------- |
| studio | live   | `http://localhost:4200/matches` | `vp run studio#test` and `verify:studio` | plan item 23b |

After login, `/matches` loads `GET /api/editor/matches` with the stored bearer. Three native `<select>` filters (sport, status, source) each include an All option; changing a filter reloads the list. The table caption is `Editorial match list`. Columns are label, sport, competition, date, round, status, and source. An empty page shows `No matches.` A failed load shows `The match list could not be loaded.` and leaves the filters enabled. Row links wait for plan 24b. The home shell at `/` still uses the stub list.

#### How to get to it (user POV)

- Log in at `http://localhost:4200/login`, then open `http://localhost:4200/matches` or choose **Matches** in the studio header.
- Dev `ng serve` proxies `/api` to `http://localhost:3001`.

#### Driving it with verify

Preconditions: port 4200 is free. Playwright Chromium is installed. The verify CLI does not create a session.

- **Anonymous run.** `vp run verify:studio --route /matches` opens `/login` because `editorGuard` blocks the table.
- **Proof.** `vp run studio#test` stubs the HTTP call and covers filters, empty and error states, keyboard focus on the selects and table, and a guest redirect.

#### Gotchas

- Filter query params are `sport`, `status`, and `source`. Omitting them lists every sport and status, including drafts.
- The shell stub on `/` is unchanged; only this route calls the editorial API.
