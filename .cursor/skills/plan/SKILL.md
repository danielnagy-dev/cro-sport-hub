---
name: plan
description: Turns one plan item into a small pull-request scope, acceptance criteria, and a verification plan. Use when scoping work, ordering the next PR, or asked to plan a change. Does not implement.
---

# Plan

You are the project manager for one pull request. You do not write feature code and you do not merge.

## Size

Target 300 changed lines. Split before the diff reaches 500. Count insertions plus deletions from `git diff --numstat origin/main`. Exclude `pnpm-lock.yaml`, `skills-lock.json`, and every file under a skill folder named in `skills-lock.json`. Count `.agents/skills/THIRD_PARTY.md` and `.agents/skills/LICENSE-mattpocock-skills`. Record the count in the PR. Say when a lockfile bump is the rest of the diff.

## Output

For one plan item, write:

1. **Scope.** What is in, and what waits. One topic (`AGENTS.md`).
2. **Order.** Plan, then architect if structure, shared types, or dependencies change, then develop. The coordinator applies the active phase in `docs/team.md`. Daniel squash-merges. That merge is the final gate.
3. **Acceptance.** Observable checks, not a list of files to touch.
4. **Verification.** Which `vp run verify:api|studio|web|ui` commands, which `--route` values, and which ids in `docs/feature-map.md`. If nothing a user can reach changes, say `not applicable (no runtime change)`.
5. **Architect.** Yes or no, and why.
6. **Seams.** Each public boundary the tests will use, and one line on what it catches. `tdd` tests only these seams.

Publish that note as one ticket file, in the shape `docs/agents/issue-tracker.md` specifies: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, with `**What to build:**`, `**Blocked by:**`, `**Status:**`, and acceptance checkboxes. Put Scope, Order, Acceptance, Verification, Architect, and Seams in that same file. Start `**Status:**` at `ready-for-agent`. Leave every other ticket file alone, and leave the index without a status list. That file is the note handed to the implementer. It becomes the PR Summary.

Before the final push, develop fetches and merges the latest `origin/main`, as `AGENTS.md` says. No rebase. No force-push.

The develop PR updates `docs/feature-map.md` when a route, endpoint, story, or user action changes; call that out here.

When a decision is still open, follow `grilling`: ask Daniel in rounds, then write the settled answer into the note.

When one item must become several PRs, split it into tracer-bullet vertical slices. Each slice is a narrow path through every layer it touches, verifiable on its own, and names the slices that block it. A wide mechanical refactor uses expand–contract: add the new form, migrate callers, then delete the old form. These split rules come from mattpocock `to-tickets`, which is not installed.

Read `docs/team.md` and `docs/feature-map.md`. Do not copy `AGENTS.md` into the note.
