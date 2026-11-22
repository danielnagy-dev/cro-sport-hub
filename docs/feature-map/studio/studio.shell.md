# studio.shell: Studio layout shell

| App    | Status | Entry point (user POV)                      | Verify               | Since                                                |
| ------ | ------ | ------------------------------------------- | -------------------- | ---------------------------------------------------- |
| studio | live   | `http://localhost:4200/pocetna` after login | `vp run studio#test` | plan items for the studio skeleton (formerly GH #34) |

Post-login home is **Početna** at `http://localhost:4200/pocetna` (`studio.pocetna`). The shell redirects `''` and unknown paths to `pocetna` (query params kept, so `/?admin=1` becomes `/pocetna?admin=1`). Header links use `/pocetna` so the active state matches the URL. Every signed-in route uses the same section header (Cro Sport Hub, Studio, **Početna**, **Sportaši**, **Objave**, **Postavke**, plus session and log out). Old match/gallery/admin deep links may still resolve until Phase H; they are not in the header and not linked from the home stub.

An editor who opens an admin-only URL (for example `/admin/competitions`) is redirected to `/` with `?admin=1`; the shell then lands on Početna with that query, and the page shows a short Croatian status that admin pages need an admin login.

#### Sub-features

- `studio.shell-header` is `StudioSectionHeader` in `apps/studio/src/app/core/studio-section-header.ts` (skip link, mark, **Studio** heading, section nav, session).
- `studio.shell-home` is the retired home stub in `feature/editor/shell`: no Matches / Review queue / New gallery / Admin shortcuts; a short lead points editors at the header nav. It is not registered in `app.routes.ts` (Početna owns `/`).

#### How to get to it (user POV)

- Log in at `http://localhost:4200/login`, then go to `http://localhost:4200/` (redirects to Početna) or choose **Početna** in the header.
- Log out returns to `/login`.

#### Driving it with verify

Preconditions: port 4200 is free. Playwright Chromium is installed. No Docker.

- **Anonymous run.** `vp run verify:studio` opens `/login` and does not show Početna. The CLI has no session.
- **Proof.** `vp run studio#test` covers the shell header, retired home shortcuts, and routing. A regression that leaves `/` without redirecting to Početna, or that reintroduces old home IA links, fails those tests.

#### Gotchas

- The first Angular dev build is slow. Readiness waits up to 180 seconds.
- `/pocetna` is behind `editorGuard`. An editor and an admin may enter. A guest is sent to `/login`.
