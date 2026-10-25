# cro-sport-hub

Public monorepo for a tennis and football results portal and an editorial studio. Version 1 uses seed and test data only. This repository is the scaffold: the apps and libraries are wired, and product features land in later pull requests.

## Layout

- `apps/web` — Next.js App Router
- `apps/studio` — Angular, standalone components and signals, built with the Angular CLI
- `apps/api` — NestJS
- `libs/shared-types`, `libs/ui` — workspace packages. `libs/slide-generator` renders the round-13 football template (ADR-003)

## Requirements

- Node.js 24.22.1 (`.node-version`)
- [Vite+](https://viteplus.dev) 1.4.0, available as `vp`

## Check the repo

From the repository root:

```bash
vp install
vp run format-check
vp run lint
vp run typecheck
vp run test
vp run build
```

Run them from the repository root. A pull request runs the set named in `AGENTS.md`. Toolchain decisions are in `docs/adr/001-vite-plus-vs-nx.md`.

## Dev servers

```bash
vp run web#dev      # http://localhost:3000
vp run studio#dev   # http://localhost:4200
vp run api#dev      # http://localhost:3001
```

## Local Postgres and Redis

`docker compose up` starts Postgres 18 and Redis 8. The API stays on the host so Vite+ can run it:

```bash
docker compose up
vp run api#dev
```

`GET http://localhost:3001/health` checks both services and returns 503 when either is down. OpenAPI is at http://localhost:3001/docs (JSON at `/docs-json`).

Load the fictional catalog (competitions, clubs, athletes, matches) into that database:

```bash
vp run api#seed
```

The command reads the root `.env` the same way as `vp run api#dev`. It writes through the catalog and skips rows that are already stored, so running it again does not duplicate them. Sample names only: no photos and no account passwords.

Copy `.env.example` to `.env` in the repository root. `vp run api#dev` loads that file before it listens, so `PORT` and `DATABASE_URL` there replace the defaults in `apps/api/src/api-config.ts`. A variable already set in the shell is left as it is.

The Compose database password is only `POSTGRES_PASSWORD` in `docker-compose.yml`. Put that value in the root `.env`. The example file uses a different password.

Build the API image from the repository root with `docker build -f apps/api/Dockerfile .`.
