# Issue tracker: GitHub Issues

Open work is a GitHub issue on [danielnagy-dev/cro-sport-hub](https://github.com/danielnagy-dev/cro-sport-hub/issues). The issue body is the spec. A pull request `## Problem` is the spec only when the pull request has no issue.

The Cursor Project board uses `CSH-*` keys for coordination. GitHub remains the implementable spec.

The retired local-markdown ticket tree is gone. Do not recreate it.

`wayfinder` is not installed. Do not create `map.md`.

## Parents and sub-issues

Medium or large work (several PR slices) uses one **parent** issue plus smaller **sub-issues**.

- The parent is an umbrella: goal and phase pointer only. It is **not** `status:ready-for-agent`.
- Each sub-issue is one implementable slice (size gates in `.cursor/skills/plan/SKILL.md` unchanged). Only a sized, unblocked child gets `status:ready-for-agent`.
- Link children with GitHub sub-issues (`gh` / REST `POST .../issues/{parent}/sub_issues` with integer `sub_issue_id` from `.id`, or GraphQL `addSubIssue`; header `GraphQL-Features: sub_issues` when needed).
- Prefer this over a flat list of plan-id-prefixed titles for multi-slice phases.

A single small ticket still stands alone (no parent required).

## When a skill says "publish to the issue tracker"

Search open issues first. Match by **human title** and, when relevant, the **parent** umbrella. Also accept a legacy title that still starts with `[<id>]`. If that issue exists, use it — do not create another.

Do **not** retry `gh issue create` (or GraphQL `createIssue`) after a successful create. A second create opens a duplicate. Record the returned number/URL once and stop.

Otherwise create **one** issue with this body:

- **Goal.** What to build. One topic.
- **Scope.** What is in, and what waits.
- **Acceptance criteria.** Observable checks, one checkbox each.
- **Blocked by.** Under the `## Blocked by` heading: list each open blocker as `#N` (optional plan id in parentheses). Say `none` or equivalent when no open issue blocks it. Extra sentences on the same section (for example `Already merged, no issue: 12a.`) are informational; only `#N` references decide order.
- **Size.** Counted lines. Target 300. Split before 500. A corrected estimate over 400 is split before the issue is ready. Umbrella parents omit a PR size estimate.
- **Notes.** Shared files, verification, architect, and seams. Optional historical plan id (for example `rewrite.B1`) lives here, not in the title.

**Title:** human-readable, no required `[<id>]` prefix. Existing issues may keep a legacy prefix until retitled; new issues should not add one.

When cutting a multi-slice phase: create the parent first (umbrella), then each child, then link sub-issues. Do not mark the parent ready-for-agent.

Metadata, applied when the issue is opened (humans via `gh`, or `.github/workflows/metadata.yml`):

- `area:<area>` matches the historical area folders (`web`, `studio`, `gallery`, `cache`, and the rest). Color `1D76DB`. Conventional Commits scopes and path cues such as `docs`, `agents`, `ci`, and `ops` map to `area:docs`.
- **Native Issue Type** (`Task`, `Bug`, or `Feature`) on issues only. Prefer Issue Type over `type:*` labels on issues. Do not add `type:feature`, `type:bug`, or `type:task` on issues.
- **PR-only `type:*` labels** from the Conventional Commits type: `docs` / `ci` / `chore` → `type:task`, `feat` → `type:feature`, `fix` → `type:bug`. Colors `C5DEF5`, `A2EEEF`, `D73A4A`.
- `status:ready-for-agent` only when the size gate in `.cursor/skills/plan/SKILL.md` is met. Color `0E8A16`. The metadata Action is conservative and skips this label when Size is missing or unclear. Never apply it to umbrella parents.

Create a missing `area:*`, `status:*`, or PR `type:*` label with that color, then apply it. Size stays in the body. There is no `size:S`, `size:M`, or `size:L` label. `status:blocked` and `status:needs-decision` are not used. Ask Daniel before an issue is ready when a decision is still open.

**Label hygiene.** Prefer `area:*` + `status:*` + PR-only `type:*`. Treat GitHub default labels (`bug`, `enhancement`, …) and `track:*` as legacy — do not auto-add them; optional cleanup later.

Assignee stays a human (or empty). GitHub Apps often cannot be assignees; do not invent a bot user. The metadata Action leaves assignee empty by default and requests reviewer `danielnagy-dev` on PRs when the author is not that maintainer. Optional assign of that maintainer is off unless `ASSIGN_MAINTAINER=true` (repo variable) or `workflow_dispatch` `assign_maintainer=true`.

### Solo maintainer + required reviews

PRs authored as `danielnagy-dev` cannot request him as reviewer (GitHub forbids self-review). Options:

- **(A)** Leave “Do not allow bypassing the above settings” **unchecked** so an admin can merge after self-check.
- **(B)** Prefer agent/bot-authored PRs when the forge supports it so Daniel can Approve.
- **(C)** A second human reviewer.

Assignee cannot be Cursor App for most cases — use empty assignee + `status:claimed`, or the PR author.

### Branch protection (Daniel, UI only)

Actions cannot replace branch protection. In GitHub: **Settings → Branches → Branch protection rules** for `main`:

1. Require a pull request before merging.
2. Require at least 1 approving review.
3. Require status checks to pass (include the `ci` job from `.github/workflows/ci.yml`).
4. Do not allow auto-merge as a substitute for review.

Do not add a status list to this file.

## When a skill says "fetch the relevant ticket"

`gh issue view <number> --repo danielnagy-dev/cro-sport-hub`. The user will normally pass the issue number or a human title (legacy `[<id>]` titles still work in search).

## Starting work

Read the issue (`gh issue view <number> --repo danielnagy-dev/cro-sport-hub`). The pull request body contains `Closes #N` for that issue; that link is the claim. Agents do not comment on the issue or set `status:claimed` (the agent token lacks issue write access).

The Plan item section names the same number. An issue with no pull request yet stays open. Agents do not merge. Daniel squash-merges. That merge is the final gate.

Before the final push, fetch and merge the latest `origin/main` as `AGENTS.md` describes.

## Order

The next work is any open **ready-for-agent** issue (not an umbrella parent) whose `## Blocked by` section has no open `#N` blockers (every `#N` listed there is closed, or the section states there is none). The issue body is the spec. There is no separate plan index in the repo.

Two issues may run in parallel when each is unblocked and their **Shared files** lists in Notes share no path (see `.cursor/skills/plan/SKILL.md`).
