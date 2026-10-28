---
name: verify
description: Prove a change works by running the real app and capturing evidence. Use before opening or updating any PR that touches apps/web, apps/studio, apps/api or libs/ui, and whenever asked to "verify", "smoke test", or "show proof". Drives the app through `vp run verify:<target>` and writes screenshots and a report to artifacts/verify/.
---

# Verify a change on the real app

Compiling and unit tests are not proof. Proof is the real app, started from this checkout, reached the way a user reaches it, with the evidence saved. One CLI covers all four targets. The map of those targets is the index `docs/feature-map.md`, the API id files under `docs/feature-map/api/`, and the studio, web, and ui area files under `docs/feature-map/` (those three stay monolithic until af6).

## 1. Pick targets

- Changed `apps/api/**` -> `api`. Changed `apps/studio/**` -> `studio`. Changed `apps/web/**` -> `web`. Changed `libs/ui/**` -> `ui` (and `web` once web uses the component).
- Changed `libs/shared-types/**` -> every target that imports the changed schema.
- Open `docs/feature-map.md`, then for each feature the diff touches read `docs/feature-map/api/<id>.md` when the id starts with `api.`, otherwise the area file for that app. Note its entry points.

## 2. Doctor (read-only, run first and whenever something looks off)

```bash
vp run verify:doctor
```

Checks Node major against `.node-version` (24.22.1), that the dev ports are free (or names the PID), and that Playwright Chromium is installed. `doctor` checks 3000, 3001, 4200, and 6006. `doctor <target>` checks that target's port. Docker is a failure for `doctor api` and a warning otherwise. Fix what it reports, or stop and report it. It never kills a process.

```bash
vpx tools/verify/verify.ts doctor api
```

## 3. Launch, drive, capture (one command per target)

```bash
vp run verify:api
vp run verify:studio
vp run verify:web
vp run verify:ui
```

Each run starts its own dev server from the repo root, waits until the app answers, drives the routes in `tools/verify/targets.ts` plus any extra `--route`, and tears the server down. To add routes:

```bash
vpx tools/verify/verify.ts studio --route /matches --route /matches/new
```

Exit code 0 means every check passed. Anything else is a failure; read `report.json`.

| Target | Start command                        | Port | Ready when                     | Default checks                                                                                            |
| ------ | ------------------------------------ | ---- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| api    | `vp run api#dev`                     | 3001 | `GET /health` is below 500     | `GET /health` is 200, `GET /docs-json` is 200 with an `openapi` field, screenshot of `/docs`              |
| studio | `vp run studio#dev`                  | 4200 | `GET /` is below 500           | `/login` shows the `main` landmark and the text `Log in`                                                  |
| web    | `vp run web#dev`                     | 3000 | `GET /` is below 500           | `/` shows the `main` landmark and heading `Cro Sport Hub`                                                 |
| ui     | `vp run @cro-sport-hub/ui#storybook` | 6006 | `GET /index.json` is below 500 | up to 10 `type: "story"` entries; today that is `Library/Base` (`library--base`) showing `Sample Athlete` |

Readiness timeout is 120 seconds, and 180 seconds for studio. Three HTTP 503s from `/health` fail immediately: the API is up and its dependencies are not.

`--url http://localhost:<port>` drives an instance that is already running. The report sets `"reused": true` and the run does not start or stop that process. The CLI uses `localhost`, not `127.0.0.1`, because Next.js 16 treats those as different dev origins and blocks HMR from the other one.

## 4. Evidence and proof standards

- Output: `artifacts/verify/<target>/<YYYYMMDD-HHmmssSSS>/` in UTC, with one PNG per route, `report.json`, `summary.md`, and `server.log`. API runs also save `health.json` and `openapi.json`. This folder is git-ignored. Cleanup never deletes it. The report is written after teardown, so a leftover process is a failed `teardown` check.
- Exercise the real user path (a route or a public endpoint), not internal setters or test-only endpoints.
- For a change in behaviour, capture the action and the resulting state (before and after screenshots, or the request and the response body), not only the final screen.
- A console error, a page error, a failed same-origin request, or a 5xx is a failure, even if the screenshot looks fine. A document status of 400 or above fails that check too.
- If a precondition is missing (no Docker, no seed data yet), the run fails with the reason. Do not weaken the check to make it pass. Write the reason in the PR and in the feature's Gotchas in its id file or area file under `docs/feature-map/`.

## 5. Report in the PR

Paste `summary.md` into the PR description under `## Verification`, and attach the screenshots (cloud agents: as artifacts). List anything you could not verify and why. Never claim a route was verified through a different route.

## 6. Keep the map honest

If the PR adds or changes something a user can reach (a route, an endpoint, a story, a button), update that feature's map entry under `docs/feature-map/` (API: `docs/feature-map/api/<id>.md`, leave `docs/feature-map/api.md` alone; studio, web, and ui: the area file until af6) and, if needed, the target's default routes in `tools/verify/targets.ts`, in the same PR. A PR does not edit the index for a new id alone.

## Cleanup

The CLI always tears down in a `finally` block and on SIGINT/SIGTERM. It kills the spawned process group (`SIGTERM`, then `SIGKILL` after 10 seconds). It never kills by process name. It runs `docker compose stop` only for Compose services this run started. Evidence under `artifacts/verify/` stays.

## Helpers

The only helper is `tools/verify/verify.ts`. Invoke it from the repository root:

```bash
vpx tools/verify/verify.ts <api|studio|web|ui|doctor> [api|studio|web|ui] [--route <path>]... [--url <baseUrl>] [--out <dir>] [--timeout <s>]
```

`vp run verify:<target>` is the same command without extra flags. First run on a machine: `vp exec playwright install chromium` (add `--with-deps` on a fresh Linux VM). Do not put that install in `postinstall`.

## Gotchas

- Run from the repository root. `vp run` inside `apps/studio` or `apps/api` resolves the wrong TypeScript (see `docs/adr/001-vite-plus-vs-nx.md`).
- The first studio run is slow (Angular dev build). The readiness timeout is 180 seconds.
- The API target needs the Compose services `postgres` and `redis`. `doctor api` and `verify:api` fail when Docker is missing. Other doctor runs warn and still exit 0.
- When the repo root has no `.env`, `verify:api` points `DATABASE_URL` at Compose using `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` from `docker-compose.yml`. A root `.env` is left as the API's own loader reads it, and is not overridden. The password is the dev placeholder already in Compose, not a secret to copy into git.
- `verify:api` forces `PORT=3001` for the process it starts.
- The studio dev server is started with `NG_CLI_ANALYTICS=false` so the CLI does not wait for a prompt. Web is started with `NEXT_TELEMETRY_DISABLED=1`.
- `next dev` may write `apps/web/AGENTS.md` when it detects an agent. Commit that file as is (see `AGENTS.md`).
- Refusing to drive a port that is already taken is deliberate. Do not start a second server on 3000, 3001, 4200, or 6006. A port is busy when binding `::` or `0.0.0.0` returns `EADDRINUSE`. `lsof -nP -iTCP:<port> -sTCP:LISTEN -Fp` names the pid when it can.
- An extra `--route` on `verify:api` is an HTTP GET that must return 200. The body is saved as JSON. It is not a browser page.

## Maintenance

When a feature changes, update its id file or area file under `docs/feature-map/` in the same PR. pstack's `/maintain-verification-skill` is the upkeep loop: the map it should keep honest is `docs/feature-map.md`, the API id files, and the studio, web, and ui area files, and the harness is `tools/verify/`, not a second copy under this skill.
