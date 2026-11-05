# Issue tracker: GitHub Issues

Open work is a GitHub issue on [danielnagy-dev/cro-sport-hub](https://github.com/danielnagy-dev/cro-sport-hub/issues). The issue body is the spec. A pull request `## Summary` is the spec only when the pull request has no issue.

The retired local-markdown ticket tree is gone. Do not recreate it.

`wayfinder` is not installed. Do not create `map.md`.

## When a skill says "publish to the issue tracker"

Search open issues first. Match a plan id by the title prefix `[<id>]` (for example `[24c]`). If that issue exists, use it.

Otherwise `gh issue create` with this body:

- **Goal.** What to build. One topic.
- **Scope.** What is in, and what waits.
- **Acceptance criteria.** Observable checks, one checkbox each.
- **Blocked by.** Under the `## Blocked by` heading: list each open blocker as `#N` (optional `[plan-id]` in parentheses). Say `none` or equivalent when no open issue blocks it. Extra sentences on the same section (for example `Already merged, no issue: 12a.`) are informational; only `#N` references decide order.
- **Size.** Counted lines. Target 300. Split before 500. A corrected estimate over 400 is split before the issue is ready.
- **Notes.** Shared files, verification, architect, and seams.

Title: `[<id>] <title>`. Keep an existing plan id such as `4b`. A new id continues the sequence the area already uses.

Labels, applied when the issue is opened:

- `area:<area>` matches the historical area folders (`web`, `studio`, `gallery`, `cache`, and the rest). Color `1D76DB`.
- `type:feature`, `type:bug`, or `type:task`. Colors `A2EEEF`, `D73A4A`, `C5DEF5`.
- `status:ready-for-agent` only when the size gate in `.cursor/skills/plan/SKILL.md` is met. Color `0E8A16`.

Create a missing label with that color, then apply it. Size stays in the body. There is no `size:S`, `size:M`, or `size:L` label. `status:blocked` and `status:needs-decision` are not used. Ask Daniel before an issue is ready when a decision is still open.

Do not add a status list to this file.

## When a skill says "fetch the relevant ticket"

`gh issue view <number> --repo danielnagy-dev/cro-sport-hub`. The user will normally pass the issue number or the `[<id>]` title.

## Starting work

Read the issue (`gh issue view <number> --repo danielnagy-dev/cro-sport-hub`). The pull request body contains `Closes #N` for that issue; that link is the claim. Agents do not comment on the issue or set `status:claimed` (the agent token lacks issue write access).

The Plan item section names the same number. An issue with no pull request yet stays open. Agents do not merge. Daniel squash-merges. That merge is the final gate.

Before the final push, fetch and merge the latest `origin/main` as `AGENTS.md` describes.

## Order

The next work is any open issue whose `## Blocked by` section has no open `#N` blockers (every `#N` listed there is closed, or the section states there is none). The issue body is the spec. There is no separate plan index in the repo.

Two issues may run in parallel when each is unblocked and their **Shared files** lists in Notes share no path (see `.cursor/skills/plan/SKILL.md`).
