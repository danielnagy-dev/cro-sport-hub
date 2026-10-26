# 20a: Sitemap for the public pages

**What to build:** The public site serves a sitemap of the home page, the two sport pages, and every athlete slug. This note is the spec.

**Blocked by:** 18b (`.scratch/web/issues/18b-sport-pages.md`) and 19a (`.scratch/web/issues/19a-athlete-profile.md`). Athlete URLs need the 8a list, which 19a already requires.

**Status:** ready-for-agent

**Size:** 200 counted lines. One sitemap module and a test with a stubbed athlete list. The pages already exist.

## Scope

In: the App Router sitemap the installed Next.js documents (`node_modules/next/dist/docs/`, as `AGENTS.md` says). The entries are `/`, `/tennis`, `/football`, and `/athletes/<slug>` for each slug from `GET /api/athletes?sport=tennis` and `?sport=football`. A failed fetch still returns the three static paths and does not fail the build. No gallery URLs and no studio URLs.

Out: the Playwright visitor test (20b). Visitor and editor Playwright stay local until deploy. This slice does not add a Compose job to CI. Update `docs/feature-map.md` with the sitemap path the framework serves.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] With a stubbed list that contains `sample-player-a` and `karlo-brkic`, the sitemap contains `/`, `/tennis`, `/football`, `/athletes/sample-player-a`, and `/athletes/karlo-brkic`.
- [ ] A rejected fetch still yields the three static paths and no athlete path.
- [ ] Studio and admin paths are absent.

## Verification

The unit test is the proof. `vp run verify:web` does not fetch the sitemap. Say `not run` for a live sitemap unless the author requested it and the API was up. `not applicable` is wrong: the route exists. Use `not run` and the reason.

## Architect

No. The web app owns the sitemap. It calls the public athlete list. No new dependency.

### Seams

- The sitemap function with a stubbed fetch. Catches a missing sport path, a dropped slug, and a studio path.
