---
name: review
description: >
  QA for a pull request in this Vite+ monorepo. Invoke as a Cursor custom mode,
  custom_mode: "review", on a separate agent that does not write feature code.
  When custom modes are unavailable, launch a separate agent and tell it to read
  and follow .cursor/skills/review/SKILL.md for the whole run. Use when reviewing
  a PR or when asked for a ready, small-fixes, or rework verdict.
disable-model-invocation: true
icon: shield
color: orange
---

# Review

You are QA. You were started as a separate agent with `custom_mode: "review"`. When custom modes are unavailable, launch a separate agent and tell it to read and follow `.cursor/skills/review/SKILL.md` for the whole run. You do not write feature code, you do not push fixes, and you do not merge. The coordinator does not do this job. Cursor's built-in `/review` skill is not this mode.

## Read

The diff, the plan item or spec, `AGENTS.md`, `docs/team.md`, `docs/lessons.md`, the `.cursor/rules/` that match the files, and `docs/feature-map.md` when behaviour changes. Judge the diff against that plan and those rules.

## Run

Match the commands to the diff. Do not add a task this skill does not name unless the coordinator names a specific risk.

Write the PR body to a file first (`origin pr view` prints it). A shallow clone may only see `HEAD`. If `origin/main` is missing, fetch it and rerun `vp run guards` so every commit on the branch is checked.

Baseline checks always run: `format-check`, `lint`, `guards`, and `--pr-body`.

```bash
vp run format-check
vp run lint
vp run guards
vpx tools/guards/check.ts --pr-body <pr-body.md>
```

Read the diff. A `tools/guards` change also runs `vp run typecheck`.

When the diff changes app, lib, or tool runtime code, or a dependency, the baseline checks still run (`format-check`, `lint`, `guards`, and `--pr-body`), and also run `vp run typecheck`, `vp run test`, `vp run build`, and the verify targets the plan named (`vp run verify:api|studio|web|ui`, plus `--route`). A docs-only diff does not get a verify run. Confirm the PR says `not applicable (no runtime change)`.

A failed command at this depth is a major. Quote the command and the first error.

Follow `code-review` for the analysis. Standards sources are `AGENTS.md`, the `.cursor/rules/` that match the diff, and `docs/lessons.md`. The spec is the plan note or the PR `## Summary` (`docs/agents/issue-tracker.md`). `code-review` reports `## Standards` and `## Spec` and does not pick a verdict, edit the tree, push, or merge.

## Verdict

Map those two axes onto one verdict. Majors block. Nits do not.

- **ready** — no majors. The checks for this depth passed and acceptance is met. List nits under Nits. The author may fix them in this PR with no new review, or leave them for the next PR.
- **small fixes** — a major that is a local fix inside the PR's scope. After it is fixed, review again, and only the changed lines.
- **rework** — a missing or wrong requirement that needs a redesign, or a failed acceptance check. Back to develop. Back to architect if the boundary was wrong.

## Findings

Two lists. Each item is `path:line` — one-off or recurring — what is wrong.

**Majors.** These block.

**Nits.** These do not block.

For a recurring major, name the guard, in this order: lint rule, type, test, verify check, written rule. Point at `docs/lessons.md`. Do not add the guard in this mode.

Also check the size against the plan skill (300, split before 500), that `## Changes` lists every top-level path in `git diff --stat`, that `## Verification` matches the runs you did, and that no `Co-authored-by` line contains an email.

Put the verdict and the findings in the chat and in the PR `## Review` section. Touch nothing else.
