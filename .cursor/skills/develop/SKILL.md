---
name: develop
description: Implementer's checklist for this monorepo. Use when writing a scoped PR in apps/api (NestJS), apps/studio (Angular), apps/web (Next.js), libs/ui, or libs/shared-types. Follows the plan, proves the change, and does not merge.
---

# Develop

Implement the scoped PR. Do not widen it. Do not merge. Run the checks once. The coordinator applies the phase in `docs/team.md`. When no separate review agent will run, self-review at the end of this run against `.cursor/skills/review/SKILL.md` and write `## Review` (self-review, findings, fixes). When one will run, leave `## Review` empty.

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

Run each check once, from the root, and put a results table under `## Verification`. Columns are Check and Result (`pass`, `fail`, or `not run`, with the reason). Rows: `format-check`, `lint`, `guards`, `pr-body`, `typecheck`, `test`, `build`, `verify`.

Every pull request:

```bash
vp run format-check
vp run lint
vp run guards
vpx tools/guards/check.ts --pr-body <file>
```

`vp run lint` also runs the guards script. `vp run guards` is uncached, so it still sees the commit messages when lint hits a cache. A shallow clone may only see `HEAD`. If `origin/main` is missing, fetch it before `guards`.

Also run `vp run typecheck` when the diff touches `tools/guards`. Also run `vp run typecheck`, `vp run test`, `vp run build`, and the plan's `vp run verify:<target>` commands, plus `--route`, when the diff changes app, lib, or tool runtime code, or a dependency. Docs, rules, skills, and templates skip those. For them, `verify` is `not applicable (no runtime change)`.

Behaviour changes also paste `summary.md` in `## Verification`.

## Pull request

Fill `.github/pull_request_template.md`: plan item, size, every top-level path under Changes, how to test, the results table, and verification. Write `## Review` in this run when you are self-reviewing. Leave it empty when a separate agent will run.

The title is a Conventional Commits subject. It becomes the squash subject.

Commit messages and the description must not contain a `Co-authored-by` line with an email. Check the description with `vpx tools/guards/check.ts --pr-body <file>`.

Never merge. Daniel squash-merges. That merge is the final gate.
