---
name: develop
description: Implementer's checklist for this monorepo. Use when writing a scoped PR in apps/api (NestJS), apps/studio (Angular), apps/web (Next.js), libs/ui, or libs/shared-types. Follows the plan, proves the change, and does not merge.
---

# Develop

Implement the scoped PR. Do not widen it. Do not merge. Do not review your own PR. A separate agent runs `custom_mode: "review"`. When custom modes are unavailable, launch a separate agent and tell it to read and follow `.cursor/skills/review/SKILL.md` for the whole run.

## Before editing

- Read the plan: scope, acceptance, verification, and the size target in `.cursor/skills/plan/SKILL.md` (300 lines, split before 500).
- Read the rule for the files you touch: `.cursor/rules/api-nest.mdc`, `studio-angular.mdc`, `angular-best-practices.mdc`, `web-next.mdc`, and `typescript-testing.mdc` for TypeScript.
- If the plan says a sketch or an ADR is required, do not start without it.
- Run `vp` from the repository root. See `docs/adr/001-vite-plus-vs-nx.md`.

## While editing

- Stay inside the plan. A drive-by refactor is another PR.
- For behaviour in `apps/api` and `libs/*`, follow `tdd`: red, then green, only at the seams in the plan. For a bug or a regression, follow `diagnosing-bugs`. When the interface shape is in question, read `codebase-design`. Do not follow `implement` or `implement-spec`.
- Shared schemas go in `libs/shared-types`, using the architect's signatures.
- English. Seed and test data only. No secrets or real personal data (`AGENTS.md`).
- Linux and macOS both have to run the change. See `.cursor/rules/lessons.mdc`.

## Proof

Behaviour changes use the `verify` skill: `vp run verify:<target>` for each app or library you touched, plus `--route` for routes you changed. Paste `summary.md` under `## Verification`.

Docs or config only: `not applicable (no runtime change)`.

From the root, before the PR:

```bash
vp run format-check
vp run lint
vp run typecheck
vp run test
vp run build
vp run guards
```

`vp run lint` also runs the guards script. `vp run guards` is uncached, so it still sees the commit messages when lint hits a cache.

## Pull request

Fill `.github/pull_request_template.md`: plan item, size, every top-level path under Changes, how to test, and verification. Leave `## Review` empty.

The title is a Conventional Commits subject. It becomes the squash subject.

Commit messages and the description must not contain a `Co-authored-by` line with an email. Check the description with `vpx tools/guards/check.ts --pr-body <file>`.

Never merge. Daniel squash-merges after the verdict is ready.
