# studio.shell: Studio layout shell

| App    | Status | Entry point (user POV)                      | Verify               | Since                                                |
| ------ | ------ | ------------------------------------------- | -------------------- | ---------------------------------------------------- |
| studio | live   | `http://localhost:4200/pocetna` after login | `vp run studio#test` | plan items for the studio skeleton (formerly GH #34) |

Post-login home is **Početna** at `http://localhost:4200/pocetna` (`studio.pocetna`). The shell redirects `''` and unknown paths to `pocetna` (query params kept, so `/?admin=1` becomes `/pocetna?admin=1`). Header links use `/pocetna` so the active state matches the URL. Every signed-in route uses the same section header (Cro Sport Hub, Studio, **Početna**, **Sportaši**, **Objave**, **Postavke**, plus session and log out).

Legacy match / gallery / review / admin / tennis-form / football-form routes are **unregistered** in `app.routes.ts` (Phase H). Deep links such as `/matches`, `/galleries/new`, or `/admin/competitions` hit the `**` redirect to Početna and do not lazy-load those feature modules. Folders remain on disk until sibling delete tickets remove them. The Početna `?admin=1` status copy still exists for any caller that lands with that query; it is no longer produced by an admin route guard for those URLs.

#### Sub-features

- `studio.shell-header` is `StudioSectionHeader` in `apps/studio/src/app/core/studio-section-header.ts` (skip link, mark, **Studio** heading, section nav, session). Nav labels, heading, skip default, log out, and nav aria-label resolve through `apps/studio/src/app/core/messages/` (`t(key)` + HR map). Key naming: `<surface>.<role>` kebab segments (`nav.pocetna`, `chrome.log-out`).
- `studio.shell-home` is the retired home stub in `feature/editor/shell`: no Matches / Review queue / New gallery / Admin shortcuts; a short lead points editors at the header nav (`shell-home.lead` in the catalog). It is not registered in `app.routes.ts` (Početna owns `/`).

#### How to get to it (user POV)

- Log in at `http://localhost:4200/login`, then go to `http://localhost:4200/` (redirects to Početna) or choose **Početna** in the header.
- **Odjava** returns to `/login`.

#### Driving it with verify

Preconditions: port 4200 is free. Playwright Chromium is installed. No Docker.

- **Anonymous run.** `vp run verify:studio` opens `/login` and does not show Početna. The CLI has no session.
- **Proof.** `vp run studio#test` covers the shell header, retired home shortcuts, and routing. A regression that leaves `/` without redirecting to Početna, or that reintroduces old home IA links, fails those tests.

#### Gotchas

- The first Angular dev build is slow. Readiness waits up to 180 seconds.
- `/pocetna` is behind `editorGuard`. An editor and an admin may enter. A guest is sent to `/login`.
