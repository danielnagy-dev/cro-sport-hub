# 01: Single-pass review

**What to build:** The default review is one pass by the reviewer. It still checks standards and the ticket. It does not spawn the vendored `code-review` sub-agents, and it does not walk the smell baseline.

In: `.cursor/skills/review` is the pass. The reviewer reads that skill, the ticket under `.scratch/`, the PR body, and `git diff origin/main...HEAD`. Another file opens only when a hunk raises a concrete question. Do not rerun the author's checks. At most one targeted command when something looks suspicious. The report is a first line, `ready` or `changes needed`, then majors, then at most five nits, one line each.

The vendored two-subagent review stays available when counted lines are greater than 400, or when Daniel asks for a deep review. Vendored files under `.agents/skills/` stay untouched. `docs/team.md` and `AGENTS.md` point at this pass so the vendored skill does not win. A dated note in `docs/lessons.md` says why: the PR #11 review spent its time in two sub-agents re-reading one diff, and in a long report.

Until the first public deploy, no separate review agent runs, including for a schema or migration, a new technology, or an ADR. Every pull request is the author's checks once, the author's self-review, and `## Review` filled by the author. A separate review runs only when Daniel explicitly asks. After launch, the post-launch path list in `docs/team.md` is unchanged. The single pass still applies when a review is requested and after launch.

Out: no new lint rule, no runtime change, no edit under `.agents/skills/`.

**Blocked by:** None (can start immediately).

**Status:** resolved

## Scope

Docs and skills only. One topic: how a review is done.

## Order

Plan note is this file. No architect. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [x] A default review, including a separate agent, is one pass: no sub-agents, no smell baseline, no parallel axes.
- [x] The read list is the review skill, the ticket, the PR body, and `origin/main...HEAD`. Other files open only from a hunk.
- [x] The author's checks are not rerun. At most one targeted command when something looks suspicious.
- [x] The report starts with `ready` or `changes needed`, then majors, then at most five one-line nits.
- [x] Two sub-agents run only when counted lines are greater than 400, or Daniel asks for a deep review.
- [x] `.agents/skills/` is unchanged. `docs/lessons.md` has a dated entry for the slow PR #11 review.
- [x] Pre-launch, no separate review agent runs, including for a schema, a new technology, or an ADR. The author checks once, self-reviews, and fills `## Review`. A separate review runs only when Daniel asks.
- [x] The post-launch risk-path list is unchanged. Develop and review say the author self-review is the default.

## Verification

Not applicable (no runtime change). Author runs `format-check`, `lint`, `guards`, and `--pr-body`.

## Architect

No. No boundary, shared type, or dependency changes.

## Seams

None. The change is the review instructions.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/14
