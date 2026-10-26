---
name: review
description: >
  Checklist for a pull request in this Vite+ monorepo. The author self-reviews
  against it at the end of the develop run and fills ## Review. A separate agent
  uses it with custom_mode: "review" only when docs/team.md says so. Use when
  reviewing a PR or when asked for a ready or changes-needed verdict.
disable-model-invocation: true
icon: shield
color: orange
---

# Review

This file is the pass, and it wins over the vendored `code-review` skill. The pass below is the whole review. Deep review is the only time that skill's two sub-agents run. The same pass is the author self-review, a review Daniel asks for, and a review after launch.

**Self-review.** The default. At the end of the develop run, the author does this pass and fills `## Review`. Fix what you find in this run.

**Separate agent.** Only when `docs/team.md` says so. During pre-launch that is only when Daniel explicitly asks. After launch, the post-launch list applies, and Daniel asking still counts. Prefer `custom_mode: "review"`. When custom modes are unavailable, launch a separate agent and tell it to read and follow this file for the whole run. Do not write feature code, do not push fixes, and do not merge. The coordinator does not review the diff. Cursor's built-in `/review` skill is not this role. The author leaves `## Review` empty for this agent.

## Read

Read this file, the PR body, and the ticket `.scratch/<feature-slug>/issues/<NN>-<slug>.md` when the PR names an id. When that file is not on the branch, the spec is the PR `## Summary` (`docs/agents/issue-tracker.md`). Then:

```bash
git diff --numstat origin/main...HEAD
git diff --stat origin/main...HEAD
git log origin/main..HEAD --oneline
```

Counted lines are insertions plus deletions in that numstat. Exclude `pnpm-lock.yaml`, `skills-lock.json`, and every file under a skill folder named in `skills-lock.json`. Count `.agents/skills/THIRD_PARTY.md` and `.agents/skills/LICENSE-mattpocock-skills`.

When the count is greater than 400, or Daniel asks for a deep review, go to **Deep review** and skip **Pass**. Otherwise read `git diff origin/main...HEAD` once.

Open another file only to answer a question a hunk already raised: the rule it may break, the area file under `docs/feature-map/` when a route, endpoint, story, or user action changes, or `docs/lessons.md` when the diff repeats a logged mistake. On the single pass, done when the ticket, the PR body, and the diff are read, and every other file was opened from a hunk.

## Pass

Skip this heading on a deep review.

One pass, in this chat. Standards and the ticket together: a rule the hunk breaks, a requirement missing or wrong, or behaviour the ticket did not ask for. No sub-agents. No smell baseline. No separate Standards and Spec write-up. Then apply **Gates**.

## Deep review

Only when **Read** sent you here. Otherwise skip to **Gates**.

This replaces **Pass**. Follow `.agents/skills/code-review/SKILL.md` (two parallel sub-agents, the smell baseline, `## Standards` and `## Spec`). Do not also read the diff yourself. Do not edit that vendored file. The vendored skill does not pick the verdict. This file does. Then apply **Gates**, and write the report from the two axis reports plus those majors.

## Gates

The author already ran the checks. Read the `## Verification` table. Do not rerun `format-check`, `lint`, `typecheck`, `test`, `build`, or `verify`. Guards already ran inside `lint`.

Fetch `origin/main` and confirm it is an ancestor of `HEAD`:

```bash
git merge-base --is-ancestor origin/main HEAD
```

That git command is not a suite rerun. Run one further command only when a hunk looks suspicious or a reported result is missing. Then stop.

Majors:

- A missing `## Verification` section. A failed reported result. Quote the command and the first error.
- Counted size past the split line at 500. Over the 300 target, and at or under 500, is a nit.
- `## Changes` misses a top-level path from `git diff --stat origin/main...HEAD`.
- A `Co-authored-by` line in the PR body or in `git log origin/main..HEAD` contains an email.
- The PR edits a ticket file that is not its own, or adds a per-item status list to `docs/agents/issue-tracker.md`.
- The final-push line is missing, or `final push: merged origin/main and reran the checks` sits on a table recorded before that merge changed the tree. The other line is `final push: origin/main already contained`.

A missing verification row is the one extra command, not a major, unless you run it and it fails. A docs-only diff says `not applicable (no runtime change)` for `verify`.

For a recurring major, name the guard, in this order: lint rule, type, test, verify check, written rule. A separate agent does not add the guard. A self-review may fix it in this PR when the fix stays in scope.

## Report

The report is only this. The first line is `ready` or `changes needed`. Then the lists. Each finding is one line: `path:line` — what is wrong.

`ready` means no majors. `changes needed` means one or more. Nits do not block. List at most 5 nits. When more exist, the last nit line ends with the number omitted.

Tag a major `local fix` when the fix stays inside the PR. Tag it `rework` when acceptance fails or the design has to change. After a local fix, the next review covers the changed lines only. The coordinator applies the active phase to that re-review. Rework goes back to develop, and to architect when the boundary was wrong.

A self-review that edited the tree adds `**Fixes**`, one line per edit. Omit it when nothing changed.

```
ready

**Majors**
None

**Nits**
- path:line — note
```

Put the report in the chat and in `## Review`. A separate agent touches nothing else. Daniel squash-merges. That merge is the final gate.
