## Problem

<!-- What was wrong or missing. Open with this, not a file list. When there is no GitHub issue, this section is the spec (`docs/agents/issue-tracker.md`). -->

## Fix

<!-- What you changed and why, in plain language. Top-level paths belong under Changes, not here. -->

## How it was tested

<!-- Before opening the PR: reproduce the bug and show it fixed, or run the relevant test(s). List commands and results, or before/after repro steps. UI: attach screenshots when possible (cloud agents: PR artifacts). Anything not verified: name it and why (e.g. `verify:api` needs Docker on a cloud VM). Docs-only runtime proof: write `docs-only, not run`. Behaviour changes: paste each `summary.md` from `artifacts/verify/` here or under Verification, with screenshots. -->

## Plan item

<!-- GitHub issue, for example `Closes #63` (`[24c] Tennis stats and submit for review`). Write `none` when there is no issue. -->

## Type of change

<!-- Check one. -->

- [ ] Bug fix
- [ ] Feature
- [ ] Task or chore
- [ ] Documentation or config

## Size

<!-- Insertions plus deletions from `git diff --numstat origin/main`, with the exclusions in the plan skill. Target 300. Split before 500. -->

## Changes

<!-- Every top-level path the diff touches. -->

## Verification

<!-- Results table from the develop skill (Check, Result). Docs or config only: `not applicable (no runtime change)` for the verify row, plus the table. One line under the table: `final push: origin/main already contained` or `final push: merged origin/main and reran the checks`. -->

## Checklist

- [ ] Format (`vp run format-check`)
- [ ] Lint (`vp run lint`, which includes guards)
- [ ] Typecheck (`vp run typecheck`, or `not run` in Verification with the reason)
- [ ] Tests (`vp run test`, or `not run` in Verification with the reason)
- [ ] Docs updated when a route, endpoint, story, or user action changed
- [ ] Counted size is not over 500 (`tools/guards/pr-size.ts` fails above that)
- [ ] Merged `origin/main` before the final push (no rebase, no force-push)

## Review

<!-- The author fills this. Report from `.cursor/skills/review`: first line `ready` or `changes needed`, then Majors, then at most five nits, and Fixes when the self-review edited the tree. Leave this empty only when a separate agent will run. Nits never block. Daniel squash-merges. Agents never merge. -->
