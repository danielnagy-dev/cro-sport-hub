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
