# 21b: File size guard for agent-authored files

**What to build:** A file size guard for agent-authored files. This note is the spec.

**Blocked by:** None

**Status:** resolved

## Summary

File size guard for agent-authored files (plan slot 21b, idea from Matt Pocock's "pre-commit hook that prevents files over 5,000 tokens", LinkedIn, 2026-10-26). Agents read whole files, so large files cost tokens and time on every later task. A hard limit with clear split instructions keeps files small at the source, with no extra review step.

Proposed title: `chore(dx): file size guard for agent-authored files`

## Scope

1. One guard script next to the existing repo guards (find them from PR #2 / `AGENTS.md`; follow their style, language and wiring, do not add a new framework).
2. Rule: a file fails when `bytes / 4 > 5000` (about 20 KB). Tokens = bytes/4 is a deliberate rough estimate, no tokenizer dependency.
3. Two entry points, same script:
   - **pre-commit**: checks only staged files. If the repo already has a git hook setup, add to it; if not, add the lightest option consistent with the repo (no new heavy dependency) and document it.
   - **verify / CI**: checks all tracked files that match the rule, so an agent cannot skip it with `--no-verify`. Wire it into the existing root `lint` or guard task that CI `ci` already runs.
4. Ignore list in one place (a small config or constant at the top of the script), at least:
   - lockfiles (`pnpm-lock.yaml` and any other `*.lock`)
   - SQL migrations (`apps/api/src/catalog/*.sql`) and seed data
   - design handoff folders (`libs/slide-generator/design/**`) and fonts, images, binaries
   - generated files (OpenAPI output, build output, anything git-ignored)
   - verbatim vendored text (`.cursor/rules/angular-best-practices.mdc`, vendored third-party skills)
5. Error message names each file, its estimated tokens and the limit, and says how to split it:
   - split by responsibility (one reason to change per file), not by line count
   - keep public imports stable, e.g. via an `index.ts` re-export
   - move tests next to the code they test, one spec per unit
   - never just raise the limit or add the file to the ignore list to pass; an exception needs Daniel's OK in the PR body
6. One line in `AGENTS.md` and in `docs/lessons.md`: the limit, where the ignore list lives, and that a repeated mistake becomes an automatic check.

## Out of scope

- Splitting existing large files. If any current file already fails, list it in the PR body with its size, add it to a clearly marked temporary baseline list in the same config, and open a follow-up ticket. Do not refactor product code in this PR.
- Any change to the PR size rule (target 300, split before 500 counted lines).

## Done when

- [x] Committing a staged non-ignored file over the limit fails with the split instructions; an ignored file over the limit passes.
- [x] The CI path fails on a non-ignored file over the limit (show once in the PR with a temporary test file or log excerpt, then remove it).
- [x] A unit test covers the token estimate, the ignore list and the error message.
- [x] All existing root tasks stay green (format-check, lint, typecheck, test, build).
- [x] The PR stays small (estimate under 150 counted lines).
- [x] Author self-review in the PR `## Review` section (no separate review before launch).

## Depends on

- Nothing. Can run in parallel with #11 and #22; it touches only tooling, `AGENTS.md` and `docs/lessons.md`.

## Follow-up

Split `tools/verify/verify.ts` (31920 bytes, 7980 estimated tokens on 2026-10-26). It is on the temporary baseline at the top of `tools/guards/file-size.ts`. This pull request does not split it. The note stays in this ticket: a pull request edits only its own ticket file.

## Comments

https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/21
