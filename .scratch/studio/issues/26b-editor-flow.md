# 26b: Editor flow through to the public list

**What to build:** One local Playwright flow signs in as the editor, saves a tennis draft, submits it, signs in as the admin, publishes it, and sees that match on the public home page. This note is the spec.

**Blocked by:** 26a (`.scratch/studio/issues/26a-review-screen.md`) and 18a (`.scratch/web/issues/18a-home.md`). Submit and publish exist because 26a waits on 12b, which waits on 12a.

**Status:** ready-for-agent

**Size:** 300 counted lines. One Playwright script and a Vite+ task. The product behavior is the earlier slices.

## Scope

In: `vp run verify:editor`. It starts the API, studio, and web the way the verify CLI starts one app, or it refuses with a clear message when a port is taken. The flow uses `EDITOR_DEMO_PASSWORD` and `ADMIN_DEMO_PASSWORD` from the environment. The test file does not contain a password, a hash, or a token. It creates a tennis draft with sample names, submits, publishes with the admin, then opens the web home and expects the new label. Axe is not required here (20b covers the visitor pages).

The default `ci` workflow does not run this task. This flow stays local until deploy. There is no Compose job in CI. When Docker is absent the author records `not run` and the reason. Do not skip the assertions to go green.

Out: a football appearance walk, gallery, and any edit to the default `vp run test` task. Update `docs/feature-map.md` `studio.review` with this command.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] With Compose up and both demo passwords set in the environment, the task signs in as the editor, saves a draft, submits, signs in as the admin, publishes, and the web home shows that match's players.
- [ ] The test source has no secret and no real person's name. Names are the Sample Player style.
- [ ] `.github/workflows/ci.yml` does not start `verify:editor`.
- [ ] A publish that leaves the match off the home page fails the task.

## Verification

`vp run verify:editor` when Docker is available. Otherwise `not run` and the reason. Paste `summary.md` when it ran.

## Architect

No. The task drives routes that the other tickets own. No new runtime dependency. Playwright is already in the catalog.

### Seams

- `vp run verify:editor`. Catches a submit that never reaches the public list, and a test that only renders studio.
