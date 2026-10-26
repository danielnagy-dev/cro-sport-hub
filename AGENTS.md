# cro-sport-hub

pnpm workspace run by Vite+ (`vp` 1.4.0). Node.js is pinned in `.node-version` (24.22.1). Package manager is pnpm 12.15.0.

## Layout

- `apps/web` — Next.js App Router (`next build`, `next dev`)
- `apps/studio` — Angular standalone components and signals. The Angular CLI builds and tests it. Vite+ only runs those commands.
- `apps/api` — NestJS (`nest build`)
- `libs/shared-types`, `libs/ui` — workspace packages. `libs/slide-generator` renders the round-13 football template (ADR-003).

Run task commands from the repository root. Library declaration emit uses the catalog compiler, and that compiler is not resolved correctly if the task runner is started inside `apps/studio` or `apps/api`. Compiler versions are in `docs/adr/001-vite-plus-vs-nx.md`.

## Before opening a pull request

The author runs each required check once, from the repository root, and records a results table under `## Verification`. The commands are in `.cursor/skills/develop/SKILL.md`. `vp run lint` runs `tools/guards/check.ts`. `vp run guards` is the same check with the cache off. `vp run typecheck` includes `ngc --noEmit` for `apps/studio`. The shared linter does not typecheck Angular templates.

## Pull requests

- One topic per pull request.
- Title is a Conventional Commits subject. The title becomes the squash commit subject.
- The description says what changed, why, and how to test it. The description becomes the squash commit body.
- Do not commit secrets or real personal data. Version 1 uses seed and test data only.
- No `Co-authored-by` line with an email in a commit message or the PR description. If a hook adds one, strip it before pushing.
- A pull request edits only its own ticket file, `.scratch/<feature-slug>/issues/<NN>-<slug>.md`. The index is `docs/agents/issue-tracker.md`. It has no status list.
- Before the final push, fetch and merge the latest `origin/main` (no rebase, no force-push). When that merge changes the tree, rerun the checks.
- Agents do not merge. Daniel squash-merges. That merge is the final gate. Who reviews is the phase in `docs/team.md`.

## Verification

- Use the `verify` skill (`.cursor/skills/verify/SKILL.md`). Run `vp run verify:<target>` for each app or library the PR touches (`api`, `studio`, `web`, `ui`), plus `--route` for the routes you changed.
- First run on a new machine: `vp exec playwright install chromium`.
- The PR description must have a `## Verification` section with the results table, the pasted `summary.md`, the screenshots (cloud agents: attach as artifacts), and anything you could not verify, with the reason. "Tests pass" alone is not verification.
- A missing `## Verification` section is blocking. One missing row is a missing result: the reviewer runs that command (`.cursor/skills/review/SKILL.md`).
- Pure docs or config PRs still include the results table. The `verify` row is `not applicable (no runtime change)`.
- Reviewers (human or agent) treat a missing Verification section as a blocking comment.

## Feature map

`docs/feature-map.md` is the index. Area files under `docs/feature-map/` list every user-reachable feature and how to reach it. Update the area file in the same PR that adds or changes a route, endpoint, story or user action. A PR adds its entry to the area file it touches, not the index.

## Corrections ladder

When a reviewer finds a mistake that could happen again, fix it at the highest level that works, in this order:

1. Code structure (types, one shared helper, delete the second way of doing it).
2. Lint rule, compiler setting or CI check (root `vite.config.ts`, tsconfig, `.github/workflows/ci.yml`).
3. A scoped rule in `.cursor/rules/`.
4. A skill in `.cursor/skills/`.

Never only a comment or a human-only style guide. Delete hacks and workarounds once the real fix lands; agents copy what they see.

## Lessons

A mistake that shows up a second time becomes an automatic check before another PR repeats it. Prefer a lint rule, then a type, then a test, then a `vp run verify:*` check, then a written rule. The log is `docs/lessons.md`. The short form agents always see is `.cursor/rules/lessons.mdc`. `vp run lint` runs `tools/guards/check.ts`. `vp run guards` is the same check with the cache off.

A file fails when bytes/4 is over 5,000 estimated tokens. The ignore list and the temporary baseline are at the top of `tools/guards/file-size.ts`. A repeated mistake becomes this automatic check (`vp run lint`, `vp run guards`, and `.githooks/pre-commit`; the root `prepare` script sets `core.hooksPath`).

## Agent skills

Vendored copies in `.agents/skills/` are read-only. On conflict, `AGENTS.md`, `docs/team.md`, and `.cursor/skills/` win. Role skills keep the repo rules and delegate general technique to those copies. Provenance and the update steps are in `.agents/skills/THIRD_PARTY.md`.

A review follows `.cursor/skills/review`: one pass, no sub-agents. The vendored `code-review` sub-agents run only when that file calls the review deep.

Vendored text that says `Call the Skill tool with X` means read and follow `.agents/skills/X/SKILL.md`. That covers `grill-me` (X is `grilling`) and `tdd` (X is `codebase-design`).

Issue tracker: local markdown, one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`. See `docs/agents/issue-tracker.md`. A ticket file, or the PR `## Summary`, is the spec.

Domain docs: ADRs use `docs/adr/template.md` and `NNN` numbers. See `docs/agents/domain.md`.

The installed set is `tdd`, `diagnosing-bugs`, `codebase-design`, `grilling`, `grill-me`, `writing-for-agents`, and `code-review`. Do not run `setup-matt-pocock-skills`. Do not install `implement`, `implement-spec`, `triage`, `to-spec`, `wayfinder`, `wizard`, or `pr`.

## Docs to read before writing framework code

- Angular: https://angular.dev/llms.txt and `.cursor/rules/angular-best-practices.mdc`
- Next.js: the version-matched docs in `node_modules/next/dist/docs/` (see the managed block below if present), index https://nextjs.org/docs/llms.txt
- NestJS: https://docs.nestjs.com/llms.txt (append `.md` to a chapter URL)
- Vite+: https://viteplus.dev/llms.txt
- Vitest: https://vitest.dev/llms.txt · Zod: https://zod.dev/llms.txt · Storybook: https://storybook.js.org/llms.txt
- ORM: Drizzle. Decision and the llms.txt link: `docs/adr/002-drizzle-vs-prisma.md`

## Next.js agent block

`next dev` writes `apps/web/AGENTS.md` with a `<!-- BEGIN:nextjs-agent-rules -->` block when it detects a coding agent. Commit that file as is.
