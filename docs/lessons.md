# Lessons

Dated log. The second time a mistake appears, it becomes a check. The order is in `.cursor/rules/lessons.mdc`: lint rule, type, test, verify check, written rule.

## 2026-10-25 — review of plan item 21a

Fixed before that PR merged.

### Linux-only port check

Port detection read the Linux proc filesystem, so on macOS every port looked free. Cause: a Linux-only API in a tool that also runs on Daniel's Mac. Guard: `tools/guards/check.ts` fails if source under `tools/`, `apps/`, `libs/`, or the repo root contains that path. Rule text: `.cursor/rules/lessons.mdc`. Runs in `vp run lint` and `vp run guards`.

### Teardown signalled only the leader pid

Children (`next-server`, `ng serve`, `nest`) survived. Cause: the signal went to the leader, not the group. Guard: written rule in `.cursor/skills/verify/SKILL.md` (kill the spawned group, never by name). The CLI already does this. No new check: proving it needs a live process tree, and a substring lock breaks on a rename.

### Report written before teardown

`summary.md` could say pass while the process exited 1. Cause: the report ran before cleanup. Guard: the verify skill — the report is written after teardown, and a leftover process fails `teardown`. No new check: the order lives in one function, and a test would have to start a server.

### Unknown Storybook stories waited for `main`

A story with no proof-map entry waited for a landmark stories do not render. Cause: the extra-route browser check was reused. Guard: verify skill and `docs/feature-map.md` — an unknown story waits for `#storybook-root`. The CLI already branches. No new check: it needs a Storybook fixture.

### `verify:api --route` opened JSON as a page

Cause: API routes and app routes shared one page checker. Guard: verify skill — an extra `--route` on `verify:api` is an HTTP GET that must return 200, saved as JSON. No new check: it needs a running API.

### Cleanup was not idempotent

A second Ctrl-C exited halfway, and a signal wrote no report. Cause: cleanup could not be entered twice. Guard: verify skill — cleanup runs in `finally` and on SIGINT/SIGTERM. No new check: it needs a process and a signal.

### Compose services recorded after `up --wait`

A failed health wait leaked containers. Cause: services were noted only after `up` succeeded. Guard: verify skill — stop only the services this run started, including when `up` fails. No new check: it needs Docker, and workflows stay unchanged.

### A crashed dev server waited out the timeout

Cause: readiness did not race the process exit. Guard: verify skill, and the CLI fails when the child exits. Three HTTP 503s from `/health` fail immediately. No new check: it needs a spawned server.

### `tools/verify` was outside the root typecheck task

CI did not typecheck the CLI. Cause: the root task listed package typechecks only. Guard: `tools/guards/check.ts` fails when a `tools/*` directory has TypeScript but its `tsconfig.json` is absent from the root `typecheck` command. `vp run typecheck` runs `tsc --noEmit` for each listed config.

### Doctor required Docker for every target

Cause: Docker was a hard failure instead of a failure only for `doctor api`. Guard: verify skill — failure for `doctor api`, a warning otherwise. No new check: it means hiding `docker` on `PATH` and rerunning doctor.

### Nits, size, trailers, and the PR text

Docs disagreed about a path, a fallback was redundant, timestamps did not say UTC, and some proofs were loose substrings. The diff was about 2.7 times the size target. Commits carried a `Co-authored-by` trailer with the owner's email, and the description missed paths.

Guards that landed here:

- Trailers: the script fails when a commit on this branch (not already on `main`) or a body passed with `--pr-body` has a `Co-authored-by` line containing an email. `main` already has agent trailers, so the scan is `origin/main..HEAD`. CI's checkout is shallow and may only see `HEAD`. Review fetches `main` and runs `vp run guards` (cache off) plus `--pr-body`.
- Size: the plan skill states the target (300 lines, split before 500). The template has a Size field. Review compares it to `git diff --numstat`. A hard cap also fails lockfile and ADR diffs, so it is not a script.
- Paths and prose: the develop skill requires every top-level path under Changes. Review compares `git diff --stat`. UTC is stated in the verify skill. Loose proofs and doc drift are review findings. A timestamp unit test would import a CLI that runs on load.

## 2026-10-25 — review of vendored skills

### Loose substring proof in a guard self-test

The vendored-skill probe treated a failure as proven when the message contained a short substring. Cause: `includes` passes when a different failure happens to share that word. This is the second time a proof was a loose substring. The first is the plan-item 21a note above. Guard: `assertVendoredSkillProbe` in `tools/guards/check.ts` compares each case to the full expected line.

## 2026-10-25 — process, after PRs 2 and 3

Those rounds re-ran the full suite for docs and treated nits as another review. Cause: the review skill had one command list and one findings list.

### Review depth follows the diff

A pull request that only touches docs, rules, skills, templates, or guards gets a light review: `format-check`, `lint`, `guards`, and a reading of the diff. A `tools/guards` change also runs `typecheck`. `typecheck`, `test`, `build`, and the relevant `verify:*` runs are for app, lib, or tool runtime code, or for a dependency change. The reviewer does not add a task the skill does not name unless the coordinator names a specific risk. Guard: written rule in `.cursor/skills/review/SKILL.md` and `docs/team.md`. No new check: which paths count is a judgement, and a script misfires on a mixed diff.

### Nits do not block

Majors and nits are separate lists. No majors means the verdict is ready, with the nit list attached. The author may fix nits in the same pull request without another review, or leave them for the next one. A re-review happens only after a major, and only on the changed lines. **small fixes** is a local major. **rework** is a redesign or a failed acceptance check. Guard: the review skill, `docs/team.md`, and `.github/pull_request_template.md`. No new check: a verdict is a judgement, not a string a script can prove.
