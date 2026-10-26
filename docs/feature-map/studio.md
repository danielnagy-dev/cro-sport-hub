# Studio

Entries for the studio. Shared preconditions and driving conventions are in `docs/feature-map.md`.

## Index

| ID                   | Feature                              | App    | Status  | Entry point (user POV)               | Verify                 | Since                                                |
| -------------------- | ------------------------------------ | ------ | ------- | ------------------------------------ | ---------------------- | ---------------------------------------------------- |
| studio.shell         | Studio layout shell                  | studio | live    | `http://localhost:4200/` after login | `vp run studio#test`   | plan items for the studio skeleton (formerly GH #34) |
| studio.login         | Login and auth guard                 | studio | live    | `http://localhost:4200/login`        | `vp run verify:studio` | plan item 22                                         |
| studio.matches       | Matches list with filters            | studio | planned | `/matches`                           | -                      | later plan                                           |
| studio.tennis-form   | Tennis match form with stats         | studio | planned | -                                    | -                      | later plan                                           |
| studio.football-form | Football match form with appearances | studio | planned | -                                    | -                      | later plan                                           |
| studio.review        | Review and publish workflow          | studio | planned | -                                    | -                      | later plan                                           |
| studio.admin         | Admin pages and import log           | studio | planned | -                                    | -                      | later plan                                           |
| studio.gallery       | Gallery composer, preview, ZIP       | studio | planned | -                                    | -                      | later plan                                           |

Planned paths are estimates. The change that builds each feature updates its row.

## Feature entries

### studio.shell: Studio layout shell

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

### studio.login: Login and auth guard

`/login` posts `{ id, password }` to `POST /api/login` and stores the JWT for the browser tab. Log out is in the studio header. An editor or an admin can open `/`. `adminGuard` allows only an admin and is not attached to a page yet. A guest or an expired token lands on `/login`. The form labels User id and Password and announces errors. The studio reads `sub`, `role`, and `exp` and does not check the signature.

#### How to get to it (user POV)

- Open `http://localhost:4200/login`, or open `/` with no session.
- Dev `ng serve` proxies `/api` to `http://localhost:3001`. The match list is still the stub.

#### Driving it with verify

Preconditions: port 4200 is free. Playwright Chromium is installed. No Docker. The API is not required to render the form.

- **Open login.** `vp run verify:studio`. The check `Login` is `pass`. `main` contains `Log in`. A 401, a bad id, and a stored session are the studio unit tests.

#### Gotchas

- Demo passwords and `JWT_SECRET` stay in the environment. The page does not display them.
