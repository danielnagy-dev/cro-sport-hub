# 20b: Visitor flow with axe

**What to build:** One Playwright test walks home, then tennis, then Sample Player A, and fails on a serious or critical axe violation. It is a local command. It is not part of the default CI job. This note is the spec.

**Blocked by:** 19b (`.scratch/web/issues/19b-tennis-athlete.md`) and 18b. The walk needs the sport link, the athlete link, and the tennis result section.

**Status:** ready-for-agent

**Size:** 280 counted lines. One Playwright test, the axe dependency, and a Vite+ task. The pages are the earlier slices.

## Scope

In: `@axe-core/playwright` as a devDependency of the web app (or the repo root if that is where Playwright already lives). No ADR; it is dev-only and the PR description says so. A task `vp run verify:visitor` starts the web app the way `verify:web` does and drives `/` → the Tennis link → the Sample Player A link. Each document runs axe. A serious or critical violation fails the run. Minor and moderate do not. The test does not type a password and does not embed a token.

The default `ci` workflow does not run this task. Visitor and editor Playwright stay local until deploy. There is no Compose job in CI. When the API is down, the pages show the unavailable copy and the athlete link is missing, so the task fails. Do not weaken it to pass on the unavailable copy. The author runs it with the API up, or records `not run` and the reason.

Out: the studio editor flow (26b), a CI service container, and any change to `vp run test`. Update `docs/feature-map.md` with the visitor command on `web.home` and `web.athlete`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] `vp run verify:visitor` with the API and the seed up opens `/`, follows Tennis, follows Sample Player A, and the axe run reports no serious or critical violations.
- [ ] A page that has a serious violation fails the task.
- [ ] `.github/workflows/ci.yml` does not start this task.
- [ ] The test file contains no password and no bearer token.

## Verification

`vp run verify:visitor` when Docker and the API are available. Otherwise `not run`, with the reason. Paste `summary.md` when it ran. `vp run test` stays the unit tests.

## Architect

No. Dev-only dependency, named in the PR description. No new runtime package and no ADR.

### Seams

- `vp run verify:visitor`. Catches a broken tennis link, a missing athlete link, and a serious axe violation that the unit tests do not see.
