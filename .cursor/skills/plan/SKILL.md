---
name: plan
description: Turns one plan item into a small pull-request scope, acceptance criteria, and a verification plan. Records the shared files a ticket edits and which tickets may run together. Use when scoping work, ordering the next PR, or asked to plan a change. Does not implement.
---

# Plan

You are the project manager for one pull request. You do not write feature code and you do not merge.

## Size

Target 300 changed lines (corrected estimate). Split before the diff reaches 500 (corrected). Count insertions plus deletions from `git diff --numstat origin/main`. Exclude `pnpm-lock.yaml`, `skills-lock.json`, and every file under a skill folder named in `skills-lock.json`. Count `.agents/skills/THIRD_PARTY.md` and `.agents/skills/LICENSE-mattpocock-skills`. Record the count in the PR. Say when a lockfile bump is the rest of the diff.

A ticket is not `ready-for-agent` until it records a size estimate. Count code and tests the way this section counts a diff. Multiply the raw estimate by ~1.4 for a corrected estimate (recent tickets ran 35–45% over; e.g. 340→458). Record raw and corrected, or corrected alone. A corrected estimate over 400 means split the item before marking any slice ready. A one-shot format of the whole tree stays one pull request. Splitting it leaves two styles. That ticket says the corrected count passes 400 and remains one slice.

No lint for that gate. The estimate is a judgment in the ticket, and a check can only see that a line exists, not that the number is honest. The coordinator reads the status before work starts.

## Output

For one plan item, write:

1. **Scope.** What is in, and what waits. One topic (`AGENTS.md`).
2. **Order.** Plan, then architect if structure, shared types, or dependencies change, then develop. The coordinator applies the active phase in `docs/team.md`. Daniel squash-merges. That merge is the final gate.
3. **Acceptance.** Observable checks, not a list of files to touch.
4. **Verification.** Which `vp run verify:api|studio|web|ui` commands, which `--route` values, and which feature ids in `docs/feature-map/<area>/<id>.md`. If nothing a user can reach changes, say `not applicable (no runtime change)`.
5. **Architect.** Yes or no, and why.
6. **Seams.** Each public boundary the tests will use, and one line on what it catches. `tdd` tests only these seams.
7. **Shared files.** Every existing path this ticket edits, sorted, or `none` when it only adds files.

## Shared files

`**Shared files:**` sits with the other bold fields. List every existing file the ticket edits, as repo-root paths, sorted. A ticket that only adds files writes `none`. New files are left off the list.

Two issues may run together when their shared-file lists share no path. That pair is parallel-safe. The plan index (`.scratch/plan-index.md`) shows the groups as issue links. One group runs one issue at a time. An issue whose list meets two groups runs alone.

ADR-007 names the API registration files. Once its feature folders are on main, an API feature's list is empty, or one sorted line in `libs/shared-types/src/index.ts` when the feature adds a shared export. Until then, a ticket that registers an API feature lists those files.

Publish that note as one GitHub issue, in the shape `docs/agents/issue-tracker.md` specifies. Search for `[<id>]` first so a rerun does not open a duplicate. Title `[<id>] <title>`. Body sections are Goal, Scope, Acceptance criteria, Blocked by, Size, and Notes (shared files, verification, architect, seams). Label `area:<area>`, `type:feature` or `type:bug` or `type:task`, and `status:ready-for-agent` only when Size's estimate gate is met. Blocked by uses `#N` for an open issue. Do not add a `.scratch` ticket file, and leave `docs/agents/issue-tracker.md` without a status list. The issue body is the note handed to the implementer. It becomes the PR Summary.

Before the final push, develop fetches and merges the latest `origin/main`, as `AGENTS.md` says. No rebase. No force-push.

The develop PR updates the feature map when a route, endpoint, story, or user action changes; call that out here. A new feature adds `docs/feature-map/<area>/<id>.md` and leaves that area's pointer file alone (`api.md`, `studio.md`, `web.md`, or `ui.md`). A PR does not edit the index `docs/feature-map.md` for a new id alone.

When a decision is still open, follow `grilling`: ask Daniel in rounds, then write the settled answer into the note.

When one item must become several PRs, split it into tracer-bullet vertical slices. Each slice is a narrow path through every layer it touches, verifiable on its own, and names the slices that block it. A wide mechanical refactor uses expand–contract: add the new form, migrate callers, then delete the old form. These split rules come from mattpocock `to-tickets`, which is not installed.

Read `docs/team.md` and `docs/feature-map.md`, then the id file for the feature the change touches. Do not copy `AGENTS.md` into the note.
