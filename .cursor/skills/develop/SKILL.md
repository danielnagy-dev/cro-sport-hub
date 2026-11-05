---
name: develop
description: Implementer's checklist for this monorepo. Use when writing a scoped PR in apps/api (NestJS), apps/studio (Angular), apps/web (Next.js), libs/ui, or libs/shared-types. Follows the plan, proves the change, and does not merge.
---

# Develop

Implement the scoped PR. Do not widen it. Do not merge. Run the checks once, and again only when the final-push merge changes the tree. The author self-reviews by default. At the end of this run, follow `.cursor/skills/review/SKILL.md` and fill `## Review` in that skill's report shape. Leave `## Review` empty only when Daniel has asked for a separate review or, after the first public deploy, when the phase in `docs/team.md` sends a separate agent.

## Before editing

- Read the plan: scope, acceptance, verification, and the size target in `.cursor/skills/plan/SKILL.md` (300 lines, split before 500). The spec is the GitHub issue (`docs/agents/issue-tracker.md`). `gh issue view <number> --repo danielnagy-dev/cro-sport-hub`.
- Before editing, read the issue. The pull request body includes `Closes #N`; that link is the claim. Agents do not comment on the issue or change issue labels (the agent token lacks issue write access). Do not add a local ticket markdown file (`docs/agents/issue-tracker.md`).
- Read the rule for the files you touch: `.cursor/rules/api-nest.mdc`, `studio-angular.mdc`, `angular-best-practices.mdc`, `web-next.mdc`, and `typescript-testing.mdc` for TypeScript.
- If the plan says a sketch or an ADR is required, do not start without it.
- Run `vp` from the repository root. See `docs/adr/001-vite-plus-vs-nx.md`.

## While editing

- Stay inside the plan. A drive-by refactor is another PR.
- For behaviour in `apps/api` and `libs/*`, follow `tdd`: red, then green, only at the seams in the plan. For a bug or a regression, follow `diagnosing-bugs`. When the interface shape is in question, read `codebase-design`. Do not follow `implement` or `implement-spec`.
- Shared schemas go in `libs/shared-types`, using the architect's signatures.
- English. Seed and test data only. No secrets or real personal data (`CODING_STANDARDS.md`).
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

Fill `.github/pull_request_template.md` in section order: Summary, Plan item, Type of change, Size, Changes, How to test, Screenshots (or `not applicable`), Verification (the results table), Checklist, and Review. Fill `## Review` in this run, in the shape `.cursor/skills/review/SKILL.md` specifies. Leave it empty only when a separate agent will run.

The title is a Conventional Commits subject. It becomes the squash subject.

Commit messages and the description must not contain a `Co-authored-by` line with an email. Check the description with `vpx tools/guards/check.ts --pr-body <file>`.

## Final push

Before the final push, fetch and merge the latest `origin/main`. This is the rule in `AGENTS.md`.

```bash
git fetch origin main
git merge origin/main
```

No rebase. No force-push. When the merge changes the tree, rerun the checks this pull request requires and update the results table. When `origin/main` is already an ancestor of `HEAD`, the recorded results stand. Under the results table, record one line: `final push: origin/main already contained` or `final push: merged origin/main and reran the checks`. Done when `git merge-base --is-ancestor origin/main HEAD` exits 0.

Never merge the pull request. Daniel squash-merges. That merge is the final gate.
