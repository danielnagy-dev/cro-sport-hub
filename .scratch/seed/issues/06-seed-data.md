# 06: Seed data

**What to build:** Load a small fictional catalog through the existing `write` / `read` seam: tennis and football, at most 10 athletes each, plus competitions, clubs, club history, tennis matches with stats, and football matches with appearances. Migrations `0001`–`0003` stay as they are. This note is the spec.

**Blocked by:** Plan item 5, resolved in PRs #11 and #12 (`.scratch/matches/issues/05-match-schema.md`, `.scratch/matches/issues/05b-football-appearances.md`).

**Status:** resolved

## Scope

In: `seedCatalog` writes the sample rows through `write`, skipping a row the `read` seam already returns, so a second run neither duplicates nor errors. A documented `vp run api#seed` command opens Postgres with the same root `.env` as `vp run api#dev`. Names follow the sample style already in the repo (`Sample Player A`, `Sample Cup`, `Sample Home`) and the fictional slide names (`Karlo Brkić` and the other four in the slide sample). No photos, crests, or real clubs. Catalog users `editor-demo` (editor) and `admin-demo` (admin) are id and role only, because match rows reference `users`. No password, email, or token.

Out: login. ADR-002 has no password column, and studio login is still planned. This seed does not invent one. `docs/feature-map.md` stays unchanged: no new route, endpoint, story, or user action. No new dependency, shared schema, or migration.

## Order

Plan, then develop. Architect is skipped: the write seam and the user row already exist. Daniel squash-merges. That merge is the final gate.

## Acceptance

- [x] `vp run api#seed` is documented and loads the sample through the catalog.
- [x] Running the load twice returns the same rows and does not throw.
- [x] A read of each seeded row equals the fixture, including a 7-6 tiebreak, tennis stats, a club spell, and a football appearance.
- [x] Tennis athletes and football athletes are each at most 10. No photo or crest field is set.
- [x] Editor and admin are catalog roles only. Credentials stay a follow-up until login exists.

## Verification

The seed is not an HTTP route. `vp run verify:api` needs Docker and does not call the seed. Proof is the PGLite suite. `verify` is `not run` for that reason.

## Architect

No. ADR-002 already places these rows behind `write` / `read`. This change adds no signature in `libs/shared-types` and no dependency.

### Seams

- `seedCatalog`, then `read` for every seeded kind. Catches a fixture the shared schema or a catalog rule rejects, and a column that does not round-trip.
- `seedCatalog` a second time, then `read`. Catches a second insert that duplicates a primary key or throws `conflict`.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/15
