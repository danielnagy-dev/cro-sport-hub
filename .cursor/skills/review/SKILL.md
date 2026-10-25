---
name: review
description: >
  Checklist for a pull request in this Vite+ monorepo. A separate agent uses it
  with custom_mode: "review" only when docs/team.md says so. Otherwise the author
  self-reviews against this checklist at the end of the develop run. Use when
  reviewing a PR or when asked for a ready, small-fixes, or rework verdict.
disable-model-invocation: true
icon: shield
color: orange
---

# Review

Who reviews is the phase in `docs/team.md`. This file is the checklist either way.

**Separate agent.** Only when that phase says so. Prefer `custom_mode: "review"`. When custom modes are unavailable, launch a separate agent and tell it to read and follow this file for the whole run. Do not write feature code, do not push fixes, and do not merge. The coordinator does not review the diff. Cursor's built-in `/review` skill is not this role. Follow `code-review` for the analysis. It reports `## Standards` and `## Spec` and does not pick a verdict, edit the tree, push, or merge.

**Self-review.** Every other PR. At the end of the develop run, the author reads the diff against the checklist below and writes `## Review` (self-review, findings, fixes). Do not start `code-review` sub-agents. Fix what you find in this run and list the fixes.

## Checklist

Read the diff, the plan item or spec, `AGENTS.md`, `docs/team.md`, `docs/lessons.md`, the `.cursor/rules/` that match the files, and `docs/feature-map.md` when behaviour changes. Judge the diff against that plan and those rules. Standards sources are `AGENTS.md`, the matching `.cursor/rules/`, and `docs/lessons.md`. The spec is the plan note or the PR `## Summary` (`docs/agents/issue-tracker.md`).

## Commands

The author already ran the checks and recorded the results table under `## Verification` (`.cursor/skills/develop/SKILL.md`). Read the diff and that table. Do not rerun `format-check`, `lint`, `typecheck`, `test`, `build`, or `verify`. Guards already ran inside `lint`. Run one targeted command only when something in the diff looks suspicious or a reported result is missing. Then stop.

A missing `## Verification` section is a major. One missing row is that one command. A failed reported result is a major. Quote the command and the first error. A docs-only diff says `not applicable (no runtime change)` for `verify`.

## Verdict

Map the standards reading and the spec reading onto one verdict. Majors block. Nits do not.

- **ready** — no majors. The reported results pass, or the one targeted command passed, and acceptance is met. List nits under Nits. Nits never block. The author may fix them in this PR with no new review, or leave them for the next PR.
- **small fixes** — a major that is a local fix inside the PR's scope. After it is fixed, review again, and only the changed lines. The coordinator applies the active phase to that re-review.
- **rework** — a missing or wrong requirement that needs a redesign, or a failed acceptance check. Back to develop. Back to architect if the boundary was wrong.

## Findings

Two lists. Each item is `path:line` — one-off or recurring — what is wrong.

**Majors.** These block.

**Nits.** These do not block.

For a recurring major, name the guard, in this order: lint rule, type, test, verify check, written rule. Point at `docs/lessons.md`. A separate agent does not add the guard. A self-review may fix it in this PR when the fix stays in scope.

Also check the size against the plan skill (300, split before 500), that `## Changes` lists every top-level path in `git diff --stat`, that `## Verification` matches the results table, and that no `Co-authored-by` line contains an email.

Put the verdict and the findings in the chat and in the PR `## Review` section. A self-review labels itself self-review and lists findings and fixes. A separate agent touches nothing else. Daniel squash-merges. That merge is the final gate.
