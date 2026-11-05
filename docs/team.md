# Team

Who does what in this repo. The coordinator is the agent that received the request. It splits the work, asks the next role, and tracks status with the `status:claimed` label on the GitHub issue (`docs/agents/issue-tracker.md`). It decides whether a separate review agent runs (Phase, below). It does not review the diff and it does not merge.

UI and UX visual design stays with a designer outside the repo. DevOps joins at deploy time. Neither has a skill here.

## Roles

| Role        | Where                                                              | Does                                                             | Does not                                             |
| ----------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------- |
| Coordinator | the agent that received the request                                | dispatches, orders, tracks, decides the review gate              | review the diff, merge                               |
| Plan        | `.cursor/skills/plan`                                              | one PR scope, acceptance, verification, order                    | implement                                            |
| Architect   | `.cursor/skills/architect`                                         | boundaries, shared types, ADRs, signatures                       | implement the feature                                |
| Develop     | `.cursor/skills/develop`                                           | the scoped change, the checks once, the PR text, and `## Review` | merge                                                |
| Review      | `.cursor/skills/review`. A separate agent only when Phase says so. | diff, the author's results, verdict, findings                    | rerun the author's checks, write feature code, merge |
| Designer    | a person, outside the repo                                         | visual UI and UX                                                 | a skill in this repo                                 |
| DevOps      | later, at deploy time                                              | hosting and the release pipeline                                 | a skill in this repo                                 |
| Daniel      | the maintainer                                                     | squash-merges. That merge is the final gate.                     | review on the agent's behalf                         |

## Shared skills

General technique is in `.agents/skills/` (read-only). On conflict, `AGENTS.md`, `docs/team.md`, and `.cursor/skills/` win.

| Role      | Also reads                                                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan      | `grilling` when a decision is open. Vertical slices and blocking edges when an item must split.                                                                  |
| Architect | `codebase-design` for depth, seam, adapter, the deletion test, and design-it-twice.                                                                              |
| Develop   | `tdd` for behaviour in `apps/api` and `libs/*`, at the plan's seams. `diagnosing-bugs` for a bug or regression.                                                  |
| Review    | `.cursor/skills/review`, one pass. Verdict is `ready` or `changes needed`. The vendored `code-review` sub-agents run only when that skill calls the review deep. |

## Phase

**Active: pre-launch.** The app is not deployed and has no users. The coordinator rewrites this heading to **Active: post-launch** at the first public deploy. Take the phase from this heading only.

The coordinator reads the active phase. During pre-launch a separate review agent runs only when Daniel explicitly asks. During post-launch it uses `git diff --name-only origin/main`, the dependency hunks when a `package.json` or `pnpm-workspace.yaml` changes, and the counted size. Daniel's request for a separate review counts in either phase.

### Pre-launch (active)

The author runs the checks once, self-reviews against `.cursor/skills/review/SKILL.md`, and fills `## Review`. Daniel squash-merges.

A separate review agent runs only when Daniel explicitly asks for one. A database schema or migration, a new technology or dependency family, or an ADR does not start one.

Quality comes from the ticket, the author's checks, and the guards. A repeated mistake becomes an automatic check, not another review step. See `docs/lessons.md`.

### Post-launch

A separate review agent runs when a changed path matches, or the counted size is greater than 300, or Daniel asks. Every other PR is an author self-review.

| Area                     | Match                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Database or catalog      | `apps/api/src/catalog/`, a `migrations` directory, a `.sql` file, `docker-compose.yml`                                |
| API                      | a path under `apps/api/`                                                                                              |
| Auth or security         | a path segment which, lowercased and split on non-letters, includes the token `auth`, `authentication`, or `security` |
| Dependencies or lockfile | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `skills-lock.json`                                           |
| CI or guards tooling     | a path under `.github/workflows/` or `tools/guards/`, or the root `vite.config.ts`                                    |
| Size                     | counted lines greater than 300                                                                                        |

Counted size is insertions plus deletions from `git diff --numstat origin/main`, with the exclusions in `.cursor/skills/plan/SKILL.md`. Over 300 selects a separate review. Split before 500 still applies.

A separate agent starts with `custom_mode: "review"` and does not share the implementer's chat. When custom modes are unavailable, launch a separate agent and tell it to read and follow `.cursor/skills/review/SKILL.md` for the whole run. Cursor's built-in `/review` skill is not this role. Custom modes are an account setting, so the repo cannot lint that launch.

## Flow

1. Plan turns one plan item into a scope and opens a GitHub issue. The size target lives in the plan skill. The issue shape is in `docs/agents/issue-tracker.md`.
2. Architect runs when that scope changes structure, shared types, or dependencies. Otherwise skip this step.
3. Develop implements that scope, runs the checks once, and opens the PR. It comments on the issue, labels `status:claimed`, and puts `Closes #N` in the PR body. It does not add a `.scratch` ticket. The results table is under `## Verification`. Which commands run is in `.cursor/skills/develop/SKILL.md`. Before the final push, it merges the latest `origin/main` as `AGENTS.md` says (no rebase, no force-push) and reruns the checks when that merge changes the tree.
4. The author fills `## Review` in the shape `.cursor/skills/review` specifies. The author leaves that section empty only when the active phase sends a separate agent.
5. Daniel squash-merges. That merge is the final gate. Agents never merge.

The reviewer follows `.cursor/skills/review`: the ticket, the PR body, and `git diff origin/main...HEAD`, in one pass. It does not rerun `format-check`, `lint`, `typecheck`, `test`, `build`, or `verify`. Guards stay in `lint`. One targeted command, only when the diff looks suspicious or a reported result is missing. It also confirms `origin/main` is an ancestor of `HEAD`.

No majors means **ready**. Nits never block. The report lists at most five. The author may fix nits in this PR without another review. **changes needed** means at least one major. A major tagged `local fix` is re-reviewed on the changed lines only. A major tagged `rework` is a redesign or a failed acceptance check.

A repeated mistake becomes a check (lint, type, test, guard, or visual comparison), or a written rule when a check cannot be added. It does not become another review step. See `.cursor/rules/lessons.mdc` and `docs/lessons.md`.
