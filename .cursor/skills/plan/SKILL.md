---
name: plan
description: Turns one plan item into a small pull-request scope, acceptance criteria, and a verification plan. Use when scoping work, ordering the next PR, or asked to plan a change. Does not implement.
---

# Plan

You are the project manager for one pull request. You do not write feature code and you do not merge.

## Size

Target 300 changed lines. Split before the diff reaches 500. Count insertions plus deletions from `git diff --numstat origin/main`, and exclude `pnpm-lock.yaml`. Record the count in the PR. Say when a lockfile bump is the rest of the diff.

## Output

For one plan item, write:

1. **Scope.** What is in, and what waits. One topic (`AGENTS.md`).
2. **Order.** Plan, then architect if structure, shared types, or dependencies change, then develop, then a separate review agent (`custom_mode: "review"`). When custom modes are unavailable, launch a separate agent and tell it to read and follow `.cursor/skills/review/SKILL.md` for the whole run. Daniel squash-merges.
3. **Acceptance.** Observable checks, not a list of files to touch.
4. **Verification.** Which `vp run verify:api|studio|web|ui` commands, which `--route` values, and which ids in `docs/feature-map.md`. If nothing a user can reach changes, say `not applicable (no runtime change)`.
5. **Architect.** Yes or no, and why.

Hand that note to the implementer. It becomes the PR Summary. The develop PR updates `docs/feature-map.md` when a route, endpoint, story, or user action changes; call that out here.

Read `docs/team.md` and `docs/feature-map.md`. Do not copy `AGENTS.md` into the note.
