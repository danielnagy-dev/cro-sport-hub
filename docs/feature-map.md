# Feature map

What exists, who uses it, and how to reach and verify it. Agents update this in the same PR that changes a feature. The verify skill (`.cursor/skills/verify/SKILL.md`) reads it.

Status: `live` (merged and verifiable) · `planned` (in the PR plan, not built).

## Baseline preconditions

- Run from the repo root on Node 24.22.1. `vp install`, then `vp exec playwright install chromium` once.
- API needs Docker Compose services `postgres` and `redis` (`docker-compose.yml`).
- Data: seed and test data only. No real people. Studio reads an in-app stub, not the API.

## Driving conventions

- Start from the baseline. `vp run verify:doctor` first.
- Prefer ARIA roles and accessible names over CSS selectors.
- One verify command starts and stops its own server. Do not drive a shared server unless you pass `--url`, and then the report must say `"reused": true`.
- Record the feature ID and the entry point with the evidence.
- Do not report a skipped entry point as verified through a different path.

## Index

| ID                   | Feature                                            | App    | Status  | Entry point (user POV)                   | Verify                 | Since                                                |
| -------------------- | -------------------------------------------------- | ------ | ------- | ---------------------------------------- | ---------------------- | ---------------------------------------------------- |
| api.health           | Health check                                       | api    | live    | `GET /health`                            | `vp run verify:api`    | plan items for the API skeleton (formerly GH #35)    |
| api.openapi          | OpenAPI docs                                       | api    | live    | `http://localhost:3001/docs`             | `vp run verify:api`    | plan items for the API skeleton (formerly GH #35)    |
| ui.library           | Component stories: Badge, SportTabs, AthleteHeader | ui     | live    | Storybook, port 6006, story Library/Base | `vp run verify:ui`     | plan items for the UI library (formerly GH #36)      |
| studio.shell         | Studio layout shell                                | studio | live    | `http://localhost:4200/`                 | `vp run verify:studio` | plan items for the studio skeleton (formerly GH #34) |
| web.home-placeholder | Web placeholder page                               | web    | live    | `http://localhost:3000/`                 | `vp run verify:web`    | scaffold                                             |
| web.home             | Latest results home                                | web    | planned | `/`                                      | -                      | later plan                                           |
| web.sport            | Sport pages (tennis, football)                     | web    | planned | `/[sport]`                               | -                      | later plan                                           |
| web.athlete          | Athlete page with club history and stats           | web    | planned | `/athletes/[slug]`                       | -                      | later plan                                           |
| studio.login         | Login and auth guard                               | studio | planned | `/login`                                 | -                      | later plan                                           |
| studio.matches       | Matches list with filters                          | studio | planned | `/matches`                               | -                      | later plan                                           |
| studio.tennis-form   | Tennis match form with stats                       | studio | planned | -                                        | -                      | later plan                                           |
| studio.football-form | Football match form with appearances               | studio | planned | -                                        | -                      | later plan                                           |
| studio.review        | Review and publish workflow                        | studio | planned | -                                        | -                      | later plan                                           |
| studio.admin         | Admin pages and import log                         | studio | planned | -                                        | -                      | later plan                                           |
| studio.gallery       | Gallery composer, preview, ZIP                     | studio | planned | -                                        | -                      | later plan                                           |

Planned paths are estimates. The change that builds each feature updates its row.

## Feature entries

### api.health: Health check

`GET /health` reports whether the API process can reach local Postgres and Redis. The body has `status` (`ok` or `error`), `postgres`, `redis`, and the linked package ids. HTTP 200 means both dependencies are up. HTTP 503 means the process is up and a dependency is not.

#### Sub-features

- `api.health-ok` returns HTTP 200 and `"status": "ok"` when Compose is up.
- `api.health-down` returns HTTP 503 when Postgres or Redis is down. That is a failed verify run, not a pass.

#### How to get to it (user POV)

- Request `GET http://localhost:3001/health`.

#### Driving it with verify

Preconditions:

- `vp run verify:doctor` reports Docker running.
- Compose services `postgres` and `redis` are healthy, or the run may start them and must stop them afterwards.
- No root `.env`, or `.env` matches the Compose user, database, and password.

- **Read health.** Run `vp run verify:api`. The `GET /health` row is `pass`, and `health.json` has `"status": "ok"`.

#### Gotchas

- A root `.env` whose `DATABASE_URL` password does not match `POSTGRES_PASSWORD` in `docker-compose.yml` makes `/health` return 503. The run fails on purpose. Do not skip the status check.
- The CLI stops only the Compose services it started.

### api.openapi: OpenAPI docs

Swagger UI at `/docs` describes the API. The machine-readable document is `/docs-json` and includes a top-level `openapi` field. The title in the UI is `Cro Sport Hub API`.

#### Sub-features

- `api.openapi-json` serves the document at `GET /docs-json`.
- `api.openapi-ui` renders Swagger UI at `/docs`.

#### How to get to it (user POV)

- Open `http://localhost:3001/docs`.
- Request `GET http://localhost:3001/docs-json`.

#### Driving it with verify

Preconditions: same as `api.health`.

- **Document.** Run `vp run verify:api`. `GET /docs-json` is `pass` and `openapi.json` contains `"openapi"`.
- **UI.** The same run screenshots `/docs` and requires the text `Cro Sport Hub API`.

#### Gotchas

- There is no global prefix. The paths are `/docs` and `/docs-json`, not `/api/docs`.

### ui.library: Component stories

Storybook shows the shared React components. Badge, SportTabs, and AthleteHeader are one story, `Library/Base` (`library--base`), not three stories. The athlete name on that story is the sample `Sample Athlete`.

#### Sub-features

- `ui.library-badge` shows Neutral, Tennis, and Football badges.
- `ui.library-tabs` shows the tennis and football tabs.
- `ui.library-athlete` shows the sample athlete header.

#### How to get to it (user POV)

- Open Storybook at `http://localhost:6006` and choose Library / Base.
- Open the story iframe `http://localhost:6006/iframe.html?id=library--base&viewMode=story`.

#### Driving it with verify

Preconditions: port 6006 is free. Playwright Chromium is installed.

- **Index and story.** Run `vp run verify:ui`. `GET /index.json` is `pass`, and the `Library/Base` row is `pass` with the text `Sample Athlete` visible. The screenshot is the proof.

#### Gotchas

- The story list comes from `/index.json` (`type: "story"`, at most 10). Adding a story does not require a code change in the driver; the new story is included on the next run. A story whose id is `library--base` must still show `Sample Athlete`.
- Do not point this check at a production build of Storybook unless you pass `--url`.

### studio.shell: Studio layout shell

The studio home page is the editor shell. The header says `Studio`, the sport nav lists Tennis and Football, and the main region lists seeded matches for the selected sport. The default sport is tennis, whose first seeded round is `QF`.

#### Sub-features

- `studio.shell-header` shows the Studio heading and the skip link.
- `studio.shell-sports` shows a button per seeded sport.
- `studio.shell-matches` lists matches inside `main`, or an alert and Try again when the stub fails.

#### How to get to it (user POV)

- Open `http://localhost:4200/`.
- There is no other route yet. The sport buttons switch the list on this page.

#### Driving it with verify

Preconditions: port 4200 is free. Playwright Chromium is installed. No Docker.

- **Open the shell.** Run `vp run verify:studio`. The page URL is `http://localhost:4200/`.
- **Proof.** The check `Studio shell` is `pass`. The `main` landmark is visible, and a list item inside it contains `QF`. The screenshot shows the Studio heading and the match list. An alert (`The match list could not be loaded.`) is a failure.

#### Gotchas

- The first Angular dev build is slow. Readiness waits up to 180 seconds.
- Match rows come from the in-app stub (`apps/studio/src/app/stub-api.ts`), not from `GET /health` or the API. A green studio run does not prove the API.
- `QF` is seed data, not a person's name. When the seed round changes, update this entry and `tools/verify/targets.ts` together.

### web.home-placeholder: Web placeholder page

The web home page is a scaffold. It shows one heading, `Cro Sport Hub`, inside `main`. It links the shared-types and UI packages by id and does not list results yet.

#### Sub-features

- `web.home-heading` renders the heading inside `main`.

#### How to get to it (user POV)

- Open `http://localhost:3000/`.

#### Driving it with verify

Preconditions: port 3000 is free. Playwright Chromium is installed.

- **Open home.** Run `vp run verify:web`. The `Home` row is `pass`, the `main` landmark is visible, and the heading text `Cro Sport Hub` is visible.

#### Gotchas

- `next dev` may write `apps/web/AGENTS.md`. Commit that file unchanged.
- Later plan items replace this placeholder. Update this entry in that PR rather than claiming the results home is live.
