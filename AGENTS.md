# cro-sport-hub

pnpm workspace run by Vite+ (`vp`). Node is pinned in `.node-version`. The package manager is pnpm (`package.json` `devEngines.packageManager`).

## Layout

- `apps/web` — Next.js App Router (`next build`, `next dev`)
- `apps/studio` — Angular standalone components and signals. The Angular CLI builds and tests it. Vite+ only runs those commands. Feature folders and import rules: `.cursor/skills/architect/SKILL.md` (**Studio app**).
- `apps/api` — NestJS (`nest build`)
- `libs/shared-types`, `libs/ui`, `libs/slide-generator` — workspace packages. Slide tokens and layout: `docs/design-system.md`. Renderer: `docs/adr/003-slide-renderer.md`.
- Where a route, HTTP client, or controller lives: `docs/agents/where.md`.

Run `vp` from the repository root. Library declaration emit uses the catalog compiler, which does not resolve if the task runner starts inside `apps/studio` or `apps/api`. Compiler versions: `docs/adr/001-vite-plus-vs-nx.md`.

## Commands

Run these from the repository root, after `pnpm install`. When `vp` or `vpx` is not on `PATH`, prefix the command with `pnpm exec`. CI (`.github/workflows/ci.yml`, job `ci`) runs `format-check`, `lint`, `typecheck`, `test`, and `build` in that order, plus `tools/guards/pr-size.ts` on pull requests. Which of those a docs-only change skips: `.cursor/skills/develop/SKILL.md`.

- `vp fmt` and `vp run format-check` — oxfmt, root `fmt` in `vite.config.ts`. Style: `CODING_STANDARDS.md`.
- `vp run lint` — Oxlint, then `tools/guards/check.ts` and `tools/guards/file-size.ts`. `vp run guards` is those guards with the cache off.
- One package's tests: `vp run <dir>#test`. `<dir>` is the package directory: `api`, `studio`, `web`, `ui`, `shared-types`, `slide-generator`. The task is in that package's `vite.config.ts`.
- `vp run verify:<target>` — `.cursor/skills/verify/SKILL.md` for `api`, `studio`, `web`, and `ui`. Evidence is `artifacts/verify/<target>/<timestamp>/` (`summary.md`, screenshots, `report.json`).
- `vpx tools/guards/check.ts --pr-body <file>` checks the pull request description.

## Hard rules

- One topic per pull request. Split before 500 counted lines (`tools/guards/pr-size.ts`; the count is in `.cursor/skills/plan/SKILL.md`). The title is a Conventional Commits subject and becomes the squash subject. The body follows `.github/pull_request_template.md` and becomes the squash commit body. Include `Closes #N`, or Plan item `none` when there is no issue (`docs/agents/issue-tracker.md`). Open work is a GitHub issue only; the spec is the issue body. Pick the next open issue whose `## Blocked by` section lists only closed issues (every `#N` there is merged, or the section says there is no open blocker such as `none`). Text after that line (for example `Already merged, no issue: 12a.`) is history only. `tools/guards/no-scratch.ts` blocks the retired local ticket tree and a tracked plan index.
- `## Verification` is required. A passing test suite is not that section. A missing section is blocking (`.cursor/skills/review/SKILL.md`). A behaviour change also includes `summary.md` from `.cursor/skills/verify/SKILL.md`. Docs-only: `verify` is `not applicable (no runtime change)`.
- Before the final push, fetch and merge the latest `origin/main`. No rebase. No force-push. When that merge changes the tree, rerun the checks.
- Agents do not merge. Daniel squash-merges. That merge is the final gate. Who reviews is the phase in `docs/team.md`.
- No `Co-authored-by` line that contains an email in a commit message or the pull request body. If a hook adds the trailer, strip it before pushing.
- English. Seed and test data only. No secrets or real personal data (`CODING_STANDARDS.md`).
- When a route, endpoint, story, or user action changes, update `docs/feature-map/<area>/<id>.md`. The id is `<area>.<slug>` (for example `api.athletes`). Extend the existing id file when it is the same feature. Add a file only for a new one. Leave `docs/feature-map.md` and the area file (`api.md`, `studio.md`, `web.md`, `ui.md`) unchanged, including when an issue names the index.
- Estimate the tokens a task will need before starting. tokens / 150k is roughly the number of tickets. Keep each run well inside its context window. Split before starting.
- Markdown does not accumulate dead prose: no session-specific, dated, or stale detail. `docs/lessons.md` is the dated log. Elsewhere, point at code instead of restating it.
- Prefer a deterministic check (lint, pre-commit, or CI) when one is feasible. The corrections ladder, and which rule each check already enforces, is `CODING_STANDARDS.md`. A repeated mistake is logged in `docs/lessons.md`. The short form agents always see is `.cursor/rules/lessons.mdc`.

## Agent modes

Each repo role skill is a mode. Read and follow `.cursor/skills/<name>/SKILL.md` for the whole run. A cloud agent can be launched with a Cursor custom mode set to that skill name (`plan`, `develop`, `review`, and the others below). Custom modes are an account setting. When they are unavailable, tell the agent to follow the matching skill file.

- **plan** — Scoping work, ordering the next pull request, or turning one plan item into a GitHub issue (`docs/agents/issue-tracker.md`). Does not implement. `.cursor/skills/plan/SKILL.md`.
- **develop** — One `ready-for-agent` issue, one pull request. Runs the checks once, fills `## Verification`, and ends with the self-review in `## Review`. Does not merge. `.cursor/skills/develop/SKILL.md`.
- **review** — The author self-review at the end of develop, or a separate agent only when `docs/team.md` says so. One pass. Verdict in `## Review`. Does not rerun the author's checks. `.cursor/skills/review/SKILL.md`.
- **architect** — A new module, dependency, public type in `libs/shared-types`, or an app boundary. Does not implement. `.cursor/skills/architect/SKILL.md`.
- **verify** — Smoke proof before a pull request that touches a runtime app or library, or when asked for proof. `vp run verify:<target>`. `.cursor/skills/verify/SKILL.md`.
- **fix-merge-conflicts** — Conflict markers or a failed merge with `main`. `.cursor/skills/fix-merge-conflicts/SKILL.md`.
- **deslop** — Clean generated noise from the diff against `main` before opening a pull request. `.cursor/skills/deslop/SKILL.md`.

Roles and the active phase: `docs/team.md`.

## Skills

Vendored copies in `.agents/skills/` are read-only. On conflict, `AGENTS.md`, `docs/team.md`, and `.cursor/skills/` win. Role skills keep the repo rules and delegate general technique to those copies. Provenance and update steps: `.agents/skills/THIRD_PARTY.md`. Do not install a skill named in `BLOCKED_SKILLS` in `tools/guards/check.ts`.

Vendored text that says `Call the Skill tool with X` means read and follow `.agents/skills/X/SKILL.md`. `grill-me` is `grilling`. `tdd` is `codebase-design`.

The issue body, or the pull request `## Summary` when there is no issue, is the spec (`docs/agents/issue-tracker.md`). ADRs: `docs/agents/domain.md`.

`next dev` writes `apps/web/AGENTS.md` with a `<!-- BEGIN:nextjs-agent-rules -->` block when it detects a coding agent. Commit that file as is.

Before writing framework code, read `CODING_STANDARDS.md`.
