# Issue tracker: GitHub Issues

Open work is a GitHub issue on [danielnagy-dev/cro-sport-hub](https://github.com/danielnagy-dev/cro-sport-hub/issues). The issue body is the spec. A pull request `## Summary` is the spec only when the pull request has no issue.

Files left under `.scratch/<area>/issues/` are history from the local-markdown tracker. Do not start work from them, and do not add a new file there.

`wayfinder` is not installed. Do not create `map.md`.

## When a skill says "publish to the issue tracker"

Search open issues first. Match a plan id by the title prefix `[<id>]` (for example `[24c]`). If that issue exists, use it.

Otherwise `gh issue create` with this body:

- **Goal.** What to build. One topic.
- **Scope.** What is in, and what waits.
- **Acceptance criteria.** Observable checks, one checkbox each.
- **Blocked by.** `#N` for an open issue. `none` when nothing open blocks it. Name a merged plan id in prose when that history matters.
- **Size.** Counted lines. Target 300. Split before 500. A corrected estimate over 400 is split before the issue is ready.
- **Notes.** Shared files, verification, architect, and seams.

Title: `[<id>] <title>`. Keep an existing plan id such as `4b`. A new id continues the sequence the area already uses.

Labels, applied when the issue is opened:

- `area:<area>` matches the old `.scratch` directory (`web`, `studio`, `gallery`, `cache`, and the rest). Color `1D76DB`.
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

Which issues may run together is `.scratch/plan-index.md`. That file is a pointer. It is not a second tracker.
