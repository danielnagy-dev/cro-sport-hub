# cro-sport-hub

pnpm workspace run by Vite+ (`vp` 1.4.0). Node.js is pinned in `.node-version` (24.22.1). Package manager is pnpm 12.15.0.

## Layout

- `apps/web` — Next.js App Router (`next build`, `next dev`)
- `apps/studio` — Angular standalone components and signals. The Angular CLI builds and tests it. Vite+ only runs those commands.
- `apps/api` — NestJS (`nest build`)
- `libs/shared-types`, `libs/ui`, `libs/slide-generator` — empty workspace packages. Domain code is a later change.

Run task commands from the repository root. Library declaration emit uses the catalog compiler, and that compiler is not resolved correctly if the task runner is started inside `apps/studio` or `apps/api`. Compiler versions are in `docs/adr/001-vite-plus-vs-nx.md`.

## Before opening a pull request

```bash
vp install
vp run format-check
vp run lint
vp run typecheck
vp run test
vp run build
vp run guards
```

`vp run typecheck` runs each package typecheck, including `ngc --noEmit` for `apps/studio`. The shared linter does not typecheck Angular templates.

## Pull requests

- One topic per pull request.
- Title is a Conventional Commits subject. The title becomes the squash commit subject.
- The description says what changed, why, and how to test it. The description becomes the squash commit body.
- Do not commit secrets or real personal data. Version 1 uses seed and test data only.
- No `Co-authored-by` line with an email in a commit message or the PR description.
- Agents do not merge. Roles and the order of work are in `docs/team.md`.

## Verification (required for every PR that changes behaviour)

- Use the `verify` skill (`.cursor/skills/verify/SKILL.md`). Run `vp run verify:<target>` for each app or library the PR touches (`api`, `studio`, `web`, `ui`), plus `--route` for the routes you changed.
- First run on a new machine: `vp exec playwright install chromium`.
- The PR description must have a `## Verification` section with the pasted `summary.md`, the screenshots (cloud agents: attach as artifacts), and anything you could not verify, with the reason. "Tests pass" alone is not verification.
- Pure docs/config PRs may write `Verification: not applicable (no runtime change)`.
- Reviewers (human or agent) treat a missing or mismatched Verification section as a blocking comment.

## Feature map

`docs/feature-map.md` lists every user-reachable feature and how to reach it. Update it in the same PR that adds or changes a route, endpoint, story or user action.

## Corrections ladder

When a reviewer finds a mistake that could happen again, fix it at the highest level that works, in this order:

1. Code structure (types, one shared helper, delete the second way of doing it).
2. Lint rule, compiler setting or CI check (root `vite.config.ts`, tsconfig, `.github/workflows/ci.yml`).
3. A scoped rule in `.cursor/rules/`.
4. A skill in `.cursor/skills/`.

Never only a comment or a human-only style guide. Delete hacks and workarounds once the real fix lands; agents copy what they see.

## Lessons

A mistake that shows up a second time becomes an automatic check before another PR repeats it. Prefer a lint rule, then a type, then a test, then a `vp run verify:*` check, then a written rule. The log is `docs/lessons.md`. The short form agents always see is `.cursor/rules/lessons.mdc`. `vp run lint` runs `tools/guards/check.ts`. `vp run guards` is the same check with the cache off.

## Docs to read before writing framework code

- Angular: https://angular.dev/llms.txt and `.cursor/rules/angular-best-practices.mdc`
- Next.js: the version-matched docs in `node_modules/next/dist/docs/` (see the managed block below if present), index https://nextjs.org/docs/llms.txt
- NestJS: https://docs.nestjs.com/llms.txt (append `.md` to a chapter URL)
- Vite+: https://viteplus.dev/llms.txt
- Vitest: https://vitest.dev/llms.txt · Zod: https://zod.dev/llms.txt · Storybook: https://storybook.js.org/llms.txt
- ORM: add the chosen ORM's llms.txt in ADR-002 when that decision lands

## Next.js agent block

`next dev` writes `apps/web/AGENTS.md` with a `<!-- BEGIN:nextjs-agent-rules -->` block when it detects a coding agent. Commit that file as is.
