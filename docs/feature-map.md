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
| api.matches          | Latest published matches                           | api    | live    | `GET /api/matches`                       | `vp run verify:api`    | plan item 7                                          |
| ui.library           | Component stories: Badge, SportTabs, AthleteHeader | ui     | live    | Storybook, port 6006, story Library/Base | `vp run verify:ui`     | plan items for the UI library (formerly GH #36)      |
| ui.results           | Scores, stats, and appearances                     | ui     | live    | Storybook, port 6006, Results stories    | `vp run verify:ui`     | plan item 16                                         |
| studio.shell         | Studio layout shell                                | studio | live    | `http://localhost:4200/`                 | `vp run verify:studio` | plan items for the studio skeleton (formerly GH #34) |
| web.home-placeholder | Web layout shell                                   | web    | live    | `http://localhost:3000/`                 | `vp run verify:web`    | plan item 17                                         |
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

### api.matches: Latest published matches

`GET /api/matches` lists published matches, newest date first. Draft and review rows are omitted. The body is a page: `items`, `limit` (default 20, max 50), `offset` (default 0), and `total`. A football item names the two clubs (`homeTeam`, `awayTeam`) and does not include a club id, slug, country, or crest. A tennis item names the two players. There is no team endpoint and no club page. A list for one sport is the follow-up.

#### How to get to it (user POV)

- Request `GET http://localhost:3001/api/matches`.
- Shapes are on `GET /docs-json`. Swagger UI is `/docs`. `limit=0` is HTTP 400.

#### Driving it with verify

Preconditions: same as `api.health`. Migrations run on the first request. No seeded matches still returns HTTP 200 and an empty page.

- **List.** `vpx tools/verify/verify.ts api --route /api/matches` returns HTTP 200. Seeded rows are proved by the PGLite suite.
- **Document.** `vp run verify:api` saves `openapi.json`. The PGLite suite asserts `/api/matches` is in that document.

#### Gotchas

- The seeded quarterfinal is a draft and is not listed.
- Club names are strings on the football item. v1 has no `/api/teams` route.
- `verify:api` does not load the sample seed.

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

### ui.results: Match scores, tennis stats, and appearances

Storybook shows a tennis set scoreboard, a retirement, a football score, serve and return percentages, and an appearances table. Names are samples. `Library/Base` is unchanged. The web home does not render these components.

#### Sub-features

- `ui.results-tennis` shows Sample Player A, set columns, Winner, and the loser's tiebreak on the 7-6 set.
- `ui.results-retired` shows Retired and does not show Winner.
- `ui.results-football` shows Sample Home, Sample Away, and the goals. It does not name a winner.
- `ui.results-tennis-stats` shows Sample Player, 60% and 66.7% from the counts, and No attempts when a denominator is zero. A real zero rate stays 0%.
- `ui.results-appearances` shows Sample Cup, the match date and round, minutes, goals, assists, and cards, including Second yellow.

#### How to get to it (user POV)

- Open Storybook at `http://localhost:6006` and choose a Results story.
- Direct iframes: `results--tennis-score`, `results--retired`, `results--football-score`, `results-tennis-stats--percentages`, `results-appearances--table`.

#### Driving it with verify

Preconditions: same as `ui.library`.

- **Stories.** Run `vp run verify:ui`. The score rows stay `pass` with `Sample Player A`, `Retired`, and `Sample Home`. Tennis stats is `pass` with `66.7%`. Appearances is `pass` with `Second yellow`.

#### Gotchas

- The tiebreak figure is the loser's points. It is announced with that player. The superscript is hidden from assistive tech so the number is not read twice.
- Football scores do not name a winner, including a 2-0.
- A tennis percentage is No attempts when its denominator is 0. That is a different cell from 0%.
- These stories are not on the web or studio pages. The home page does not render `MatchCard`, so the stats view and the appearances table stay in the library.

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

### web.home-placeholder: Web layout shell

The public home page is a layout shell. It shows a skip link, a header link back to `/`, and the heading `Cro Sport Hub` inside `main`. Colors and type come from the shared UI tokens. It does not list results. A typed read client for `/api/sports` and `/api/matches` lives in the app and is not called from this page.

#### Sub-features

- `web.home-heading` renders the heading inside `main`.
- `web.home-skip` offers a skip link to `#content`. The verify check still proves the heading.

#### How to get to it (user POV)

- Open `http://localhost:3000/`.
- The header link returns to this page. There is no other route yet.

#### Driving it with verify

Preconditions: port 3000 is free. Playwright Chromium is installed.

- **Open home.** Run `vp run verify:web`. The `Home` row is `pass`, the `main` landmark is visible, and the text `Cro Sport Hub` is visible inside it.

#### Gotchas

- `next dev` may write `apps/web/AGENTS.md`. Commit that file unchanged.
- The read client is not called from this page. `GET /api/matches` returns a page of published results, and `GET /api/sports` is still not served. This client expects a `Match` array, so the page does not call either path.
- The skip link stays off-screen until it receives focus, so the screenshot shows the header and the heading.
- Later plan items replace this shell with the results home. Update this entry in that PR rather than claiming the results home is live.
