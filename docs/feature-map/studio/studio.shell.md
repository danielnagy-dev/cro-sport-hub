# studio.shell: Studio layout shell

| App    | Status | Entry point (user POV)               | Verify               | Since                                                |
| ------ | ------ | ------------------------------------ | -------------------- | ---------------------------------------------------- |
| studio | live   | `http://localhost:4200/` after login | `vp run studio#test` | plan items for the studio skeleton (formerly GH #34) |

The studio home page is the editor shell. The header says `Studio`, the sport nav lists Tennis and Football, and the main region lists seeded matches for the selected sport. The default sport is tennis, whose first seeded round is `QF`.

#### Sub-features

- `studio.shell-header` shows the Studio heading and the skip link.
- `studio.shell-sports` shows a button per seeded sport.
- `studio.shell-matches` lists matches inside `main`, or an alert and Try again when the stub fails.

#### How to get to it (user POV)

- Log in at `http://localhost:4200/login`, then stay on `http://localhost:4200/`.
- The sport buttons switch the list on this page. Log out returns to `/login`.

#### Driving it with verify

Preconditions: port 4200 is free. Playwright Chromium is installed. No Docker.

- **Anonymous run.** `vp run verify:studio` opens `/login` and does not show this list. The CLI has no session.
- **Proof.** `vp run studio#test` renders the shell. A list item contains `QF`. An alert (`The match list could not be loaded.`) is a failure.

#### Gotchas

- The first Angular dev build is slow. Readiness waits up to 180 seconds.
- Match rows come from the in-app stub (`apps/studio/src/app/stub-api.ts`), not from `GET /health` or the API. A green studio run does not prove the API.
- `QF` is seed data, not a person's name. When the seed round changes, update this entry and the shell unit test together.
- `/` is behind `editorGuard`. An editor and an admin may enter. A guest is sent to `/login`.
