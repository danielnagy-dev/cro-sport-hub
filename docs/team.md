# Team

Who does what in this repo. The coordinator is the agent that received the request. It splits the work, asks the next role, and tracks status. It does not review code and it does not merge.

UI and UX visual design stays with a designer outside the repo. DevOps joins at deploy time. Neither has a skill here.

## Roles

| Role        | Where                                                                                                                                                                                                      | Does                                          | Does not                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------- |
| Coordinator | the agent that received the request                                                                                                                                                                        | dispatches, orders, tracks                    | review code, merge           |
| Plan        | `.cursor/skills/plan`                                                                                                                                                                                      | one PR scope, acceptance, verification, order | implement                    |
| Architect   | `.cursor/skills/architect`                                                                                                                                                                                 | boundaries, shared types, ADRs, signatures    | implement the feature        |
| Develop     | `.cursor/skills/develop`                                                                                                                                                                                   | the scoped change, proof, the PR text         | merge, self-approve          |
| Review      | `.cursor/skills/review`. Start with `custom_mode: "review"`. When custom modes are unavailable, launch a separate agent and tell it to read and follow `.cursor/skills/review/SKILL.md` for the whole run. | checks, verdict, findings                     | write feature code, merge    |
| Designer    | a person, outside the repo                                                                                                                                                                                 | visual UI and UX                              | a skill in this repo         |
| DevOps      | later, at deploy time                                                                                                                                                                                      | hosting and the release pipeline              | a skill in this repo         |
| Daniel      | the maintainer                                                                                                                                                                                             | squash-merges a PR whose verdict is ready     | review on the agent's behalf |

## Shared skills

General technique is in `.agents/skills/` (read-only). On conflict, `AGENTS.md`, `docs/team.md`, and `.cursor/skills/` win.

| Role      | Also reads                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| Plan      | `grilling` when a decision is open. Vertical slices and blocking edges when an item must split.                 |
| Architect | `codebase-design` for depth, seam, adapter, the deletion test, and design-it-twice.                             |
| Develop   | `tdd` for behaviour in `apps/api` and `libs/*`, at the plan's seams. `diagnosing-bugs` for a bug or regression. |
| Review    | `code-review`, then ready (nits do not block), small fixes, or rework.                                          |

## Flow

1. Plan turns one plan item into a scope. The size target lives in the plan skill.
2. Architect runs when that scope changes structure, shared types, or dependencies. Otherwise skip this step.
3. Develop implements that scope, runs the checks, and opens the PR. `## Review` stays empty.
4. A separate agent reviews. Start it with `custom_mode: "review"` on the PR branch. When custom modes are unavailable, launch a separate agent and tell it to read and follow `.cursor/skills/review/SKILL.md` for the whole run. It does not share the implementer's chat. Cursor's built-in `/review` skill is not this role.
5. Daniel squash-merges when the verdict is ready. Agents never merge.

Baseline checks always run: `format-check`, `lint`, `guards`, and `--pr-body`. Review depth then follows the diff. Docs, rules, skills, templates, and guards get those baseline checks and a reading of the diff. `tools/guards` also gets `typecheck`. App, lib, or tool runtime code, and dependency changes, also get `typecheck`, `test`, `build`, and the named `verify:*` runs. The reviewer adds nothing else unless the coordinator names a risk.

No majors means **ready**, with the nits listed. The author may fix nits in this PR without another review. **small fixes** is a local major, and the next review covers only the changed lines. **rework** is a redesign or a failed acceptance check.

A repeated mistake becomes a check, or a written rule when a check cannot be added. See `.cursor/rules/lessons.mdc` and `docs/lessons.md`.
