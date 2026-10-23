# cro-sport-hub

pnpm workspace run by Vite+ (`vp` 1.4.0). Node.js is pinned in `.node-version` (24.22.1). Package manager is pnpm 12.15.0.

## Layout

- `apps/web` — Next.js App Router (`next build`, `next dev`)
- `apps/studio` — Angular standalone components and signals. The Angular CLI builds and tests it. Vite+ only runs those commands.
- `apps/api` — NestJS (`nest build`)
- `libs/shared-types`, `libs/ui`, `libs/slide-generator` — empty workspace packages. Domain code is a later change.

Run task commands from the repository root. `apps/studio` and `apps/api` pin TypeScript 6. The web app, the libraries, and the root package use TypeScript 7 from the pnpm catalog. Library builds emit declarations with TypeScript 7's native compiler. That compiler is not resolved correctly if the task runner is started inside `apps/studio` or `apps/api`.

## Before opening a pull request

```bash
vp install
vp run format-check
vp run lint
vp run typecheck
vp run test
vp run build
```

`vp run typecheck` includes `ngc --noEmit` for `apps/studio`. `vp check` does not typecheck Angular templates.

## Pull requests

- One topic per pull request.
- Title is a Conventional Commits subject. The title becomes the squash commit subject.
- The description says what changed, why, and how to test it. The description becomes the squash commit body.
- Do not commit secrets or real personal data. Version 1 uses seed and test data only.
