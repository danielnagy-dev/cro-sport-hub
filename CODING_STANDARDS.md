# Coding standards

Style, and how to change code when a mistake could happen again. App conventions stay in the scoped rules and are not copied here: `.cursor/rules/api-nest.mdc`, `.cursor/rules/studio-angular.mdc`, `.cursor/rules/angular-best-practices.mdc`, `.cursor/rules/web-next.mdc`, `.cursor/rules/typescript-testing.mdc`.

## Style

TypeScript and JavaScript use single-quoted strings, no semicolons, and trailing commas in multi-line lists. JSX attribute strings stay double-quoted (`jsxSingleQuote` default). Oxfmt also formats Angular templates, including `@if` control flow.

`vp fmt` and `vp run format-check` read the root `fmt` object in `vite.config.ts` (oxfmt). Run `vp fmt` before committing when you touch formatted files. `.githooks/pre-commit` and `.githooks/pre-merge-commit` run `vp fmt --check`.

## Language and data

Repository language is English. Do not commit secrets or real personal data. Version 1 uses seed and test data only.

## Corrections ladder

When a mistake could happen again, fix it at the highest level that works, in this order:

1. Code structure (types, one shared helper, delete the second way of doing it).
2. A lint rule, compiler setting, or CI check (`vite.config.ts`, tsconfig, `.github/workflows/ci.yml`).
3. A scoped rule in `.cursor/rules/`.
4. A skill in `.cursor/skills/`.

Prefer a deterministic check (lint, pre-commit, or CI) when one is feasible. A written rule is last, and only when a check cannot be added. Say why in `docs/lessons.md`. Never only a comment or a human-only style guide. Delete the workaround once the real fix lands. The order among checks is `.cursor/rules/lessons.mdc`: lint rule, then a type, then a test, then a `vp run verify:*` check, then a written rule.

## What a check already enforces

| Rule                                                                                                                                                           | Check                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript, JavaScript, and Angular template formatting (quotes, semicolons, trailing commas, control flow)                                                    | `vp fmt --check` via `vp run format-check`, `.githooks/pre-commit`, and `.githooks/pre-merge-commit` (git does not run `pre-commit` for a merge). Oxlint does not check formatting.                   |
| A pull request over 500 counted lines                                                                                                                          | CI job `ci` runs `vpx tools/guards/pr-size.ts`.                                                                                                                                                       |
| A `Co-authored-by` line that contains an email                                                                                                                 | `tools/guards/check.ts`, from `vp run lint` and `vp run guards`. `--pr-body` checks the description. The guard cannot stop a hook from writing the trailer.                                           |
| A Linux proc path in source under `apps/`, `libs/`, `tools/`, or the repo root                                                                                 | `tools/guards/check.ts`                                                                                                                                                                               |
| A file over 5,000 estimated tokens (bytes/4)                                                                                                                   | `tools/guards/file-size.ts`, from `vp run lint`, `vp run guards`, and `.githooks/pre-commit` on staged files. The ignore list and the temporary baseline are in `tools/guards/file-size.config.json`. |
| A blocked skill, a vendored symlink, a `skills-lock.json` mismatch, a studio import boundary break, or a tools typecheck project missing from the root command | `tools/guards/check.ts`                                                                                                                                                                               |
| `toThrow` with no message, and the rules listed in `lint.rules`                                                                                                | `vp run lint` (Oxlint, `vite.config.ts`)                                                                                                                                                              |
| Angular template types                                                                                                                                         | `vp run typecheck` (`ngc --noEmit` for `apps/studio`). The shared linter does not typecheck Angular templates.                                                                                        |

A check cannot see these, so they stay written rules:

- Whether a token estimate or a line estimate is honest (`.cursor/skills/plan/SKILL.md`).
- Dead prose in markdown. A linter cannot tell a stale sentence from a live rule.
- An agent merging a pull request (`docs/team.md`).
- The shell route list is one `loadChildren` entry per studio feature, in folder order, in `apps/studio/src/app/app.routes.ts`. Paths live in `apps/studio/src/app/feature/<name>/<name>.routes.ts` (`docs/adr/008-studio-feature-routes.md`). Two features that insert beside each other in that list still share the shell. A studio feature's HTTP client is `apps/studio/src/app/core/<name>-api.ts`. Do not add a new screen's methods to `studio-api.ts`. API features are separate files (`docs/adr/007-api-feature-files.md`).

## Before writing framework code

- Angular: https://angular.dev/llms.txt and `.cursor/rules/angular-best-practices.mdc`
- Next.js: the version-matched docs in `node_modules/next/dist/docs/` (the managed block in `apps/web/AGENTS.md` when `next dev` has written it), index https://nextjs.org/docs/llms.txt
- NestJS: https://docs.nestjs.com/llms.txt (append `.md` to a chapter URL)
- Vite+: https://viteplus.dev/llms.txt
- Vitest: https://vitest.dev/llms.txt · Zod: https://zod.dev/llms.txt · Storybook: https://storybook.js.org/llms.txt
- ORM: Drizzle. Decision and the llms.txt link: `docs/adr/002-drizzle-vs-prisma.md`
