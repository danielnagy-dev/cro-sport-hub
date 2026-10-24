# cro-sport-hub

Public monorepo for a tennis and football results portal and an editorial studio. Version 1 uses seed and test data only. This repository is the scaffold: the apps and libraries are wired, and product features land in later pull requests.

## Layout

- `apps/web` — Next.js App Router
- `apps/studio` — Angular, standalone components and signals, built with the Angular CLI
- `apps/api` — NestJS
- `libs/shared-types`, `libs/ui`, `libs/slide-generator` — empty packages wired into the workspace

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

Run those commands from the repository root before opening a pull request. Conventions are in `AGENTS.md`. Toolchain decisions are in `docs/adr/001-vite-plus-vs-nx.md`.

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

Defaults live in `apps/api/src/api-config.ts` and match `.env.example` and `docker-compose.yml`. Copy `.env.example` to `.env` to override them. The database password is only for that local Compose file.

Build the API image from the repository root with `docker build -f apps/api/Dockerfile .`.
