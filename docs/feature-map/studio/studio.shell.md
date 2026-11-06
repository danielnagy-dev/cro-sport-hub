# studio.shell: Studio layout shell

| App    | Status | Entry point (user POV)               | Verify               | Since                                                |
| ------ | ------ | ------------------------------------ | -------------------- | ---------------------------------------------------- |
| studio | live   | `http://localhost:4200/` after login | `vp run studio#test` | plan items for the studio skeleton (formerly GH #34) |

The studio home route is `http://localhost:4200/`. It shows the shell header (Cro Sport Hub, Studio, session, log out) and the home view: links to **Matches**, **New gallery**, and for admins **Admin**. Match lists and filters live on `/matches` ([studio.matches](studio.matches.md)).

An editor who opens an admin-only URL (for example `/admin/competitions`) is redirected to `/` with `?admin=1`; the home view shows a short message that admin pages need an admin login.

#### Sub-features

- `studio.shell-header` shows the Studio heading and the skip link.
- `studio.shell-home` shows role-based shortcuts on `/`.

#### How to get to it (user POV)

- Log in at `http://localhost:4200/login`, then go to `http://localhost:4200/`.
- Log out returns to `/login`.

#### Driving it with verify

Preconditions: port 4200 is free. Playwright Chromium is installed. No Docker.

- **Anonymous run.** `vp run verify:studio` opens `/login` and does not show this home view. The CLI has no session.
- **Proof.** `vp run studio#test` covers the home shell and routing. A regression that leaves `/` without the home view fails those tests.

#### Gotchas

- The first Angular dev build is slow. Readiness waits up to 180 seconds.
- `/` is behind `editorGuard`. An editor and an admin may enter. A guest is sent to `/login`.
