---
name: fix-merge-conflicts
description: Resolve git merge conflicts with minimal edits and restore a buildable branch. Use when the branch has conflict markers or a failed merge with main.
---

# Fix merge conflicts

## Trigger

Branch has unresolved merge conflicts and needs a reliable path to a buildable state.

## Workflow

1. Fetch and merge the latest `origin/main` into the branch (`git fetch origin main && git merge origin/main`). No rebase. No force-push.
2. Detect all conflicting files from git status and conflict markers.
3. Resolve each conflict with minimal, correctness-first edits.
4. Prefer preserving both sides when safe. Otherwise, choose the variant that compiles and keeps public behavior stable.
5. Regenerate lockfiles with package manager tools instead of hand-editing.
6. Run compile, lint, and relevant tests.
7. Stage resolved files and summarize key decisions.
8. When checks pass, push the branch per `AGENTS.md` and `.cursor/skills/develop/SKILL.md` (fetch and merge `origin/main` again before the final push if needed).

## Guardrails

- Keep changes minimal and readable.
- Do not leave conflict markers in any file.
- Avoid broad refactors while resolving conflicts.
- Do not push or tag until conflicts are resolved and compile, lint, and relevant tests pass.

## Output

- Files resolved
- Notable resolution choices
- Build/test outcome

## Source

Vendored from Cursor Team Kit plugin (id 677), copied 2026-10-29, unmodified except: merge `origin/main` into the branch (no rebase, no force-push); the do-not-push guardrail applies only during resolution (push after checks pass, per repo workflow).
