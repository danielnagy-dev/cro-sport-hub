## Summary

<!-- What changed and why, in a few sentences. This section is the spec when the ticket file is not on the branch. -->

## Plan item

<!-- Local ticket id and one line, for example `22 studio login` (`.scratch/auth/issues/22-studio-login.md`). Write `none` when there is no plan id. A GitHub issue link is optional. The tracker is the local file. -->

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

## How to test

<!-- Steps a reviewer can run. For docs or config, say which files to read. -->

## Screenshots

<!-- UI only. Before and after, or the paths under `artifacts/verify/`. Write `not applicable` when nothing visual changed. Cloud agents attach files as artifacts. -->

## Verification

<!-- Results table from the develop skill (Check, Result). Then `summary.md` for each verify target, screenshots, and anything not verified, with the reason. Docs or config only: `not applicable (no runtime change)` plus the table. One line under the table: `final push: origin/main already contained` or `final push: merged origin/main and reran the checks`. -->

## Checklist

- [ ] Format (`vp run format-check`)
- [ ] Lint (`vp run lint`, which includes guards)
- [ ] Typecheck (`vp run typecheck`, or `not run` in Verification with the reason)
- [ ] Tests (`vp run test`, or `not run` in Verification with the reason)
- [ ] Docs updated when a route, endpoint, story, or user action changed
- [ ] Counted size is under 500
- [ ] Merged `origin/main` before the final push (no rebase, no force-push)

## Review

<!-- The author fills this. Report from `.cursor/skills/review`: first line `ready` or `changes needed`, then Majors, then at most five nits, and Fixes when the self-review edited the tree. Leave this empty only when a separate agent will run. Nits never block. Daniel squash-merges. -->
