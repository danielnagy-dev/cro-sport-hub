# 05b: Football match and appearances

**What to build:** Persist a football match and its appearances on the catalog seam from ADR-002. Shapes stay `footballMatchSchema` and `appearanceSchema` in `libs/shared-types`. Raw counts only. This note is the spec.

**Blocked by:** `.scratch/matches/issues/05-match-schema.md` (resolved, PR #11).

**Status:** resolved

## Scope

In: `football_matches` and `appearances` on the existing `write` / `read` seam. A football match stores the two clubs and the two goal counts. An appearance stores started, minutes, goals, assists, yellow cards, and the red-card flag for one tracked athlete. No derived column. New file `0003_v1_football.sql`, safe to run again (`IF NOT EXISTS` only). The runner splits on every semicolon, so the file has no `DO` block. `0001_v1_catalog.sql` and `0002_v1_matches.sql` stay byte-for-byte. No column change on `matches`, `tennis_matches`, or `tennis_match_stats`. Index `appearances (athlete_id)` for plan item 8, because the primary key leads with `match_id`.

Out: read endpoints (plan items 7 and 8), studio forms, and any change to `libs/shared-types`. `docs/feature-map.md` stays unchanged. No new route and no new dependency.

## Order

Plan, then architect, then develop. This is a catalog migration, so a separate review agent follows. Daniel squash-merges. That merge is the final gate.

## Acceptance

- [x] A football match and an appearance read back equal to the shared schema, including a zero (assists) and a false flag (`redCard`). No extra field comes back.
- [x] Football detail on a tennis match is `invalid` / `A football match needs a football match`.
- [x] An appearance on a tennis match is `invalid` / `An appearance needs a football match`. A tennis athlete is `invalid` / `Appearances are for football athletes`.
- [x] An appearance whose club is not one of the two sides is `invalid` / `The appearance club is one of the two sides`. A football match with no score row yet is `unknown-ref` / `The football match is not in the catalog`.
- [x] A repeated football match or appearance is `conflict` / `That record is already stored`. An unknown club is `unknown-ref` / `Unknown row`.
- [x] A shared-schema failure is `invalid` / `The record does not match the shared schema`, and the Zod error is `cause`. That covers the same club on both sides, and a goal with zero minutes.
- [x] Opening the catalog twice still succeeds after these rows exist.

## Verification

The catalog is not an HTTP route. `vp run verify:api` needs Docker. Proof is the PGLite suite. `verify` is `not run` for that reason.

## Architect

Yes. The two kinds extend the catalog. No new ADR: ADR-002 already places the rows in `apps/api` and the Zod entities in `libs/shared-types`.

`write` / `read` gain `footballMatch` and `appearance`. A football match is read by its match id. An appearance is read by `{ matchId, athleteId }`, the same key shape as tennis stats. Hidden columns stripped on read: `sportSlug` on the football match, `matchSport` and `athleteSport` on the appearance. They exist so a composite foreign key can require a football match and a football athlete.

`football_matches` references `matches (id, sport_slug)` and checks `sport_slug = 'football'`. Clubs reference `teams (id)`. Teams are already football-only, and `0001` is not altered, so there is no new unique pair on `teams`. `appearances` references `matches (id, sport_slug)`, `football_matches (match_id)`, and `athletes (id, sport_slug)`, and checks both sport columns are `football`. The score-row foreign key is what makes "one of the two sides" a real row. Count relations stay in `appearanceIssues`, which `appearanceSchema` already runs.

Rejected: a second opener, one write that stores the match and the appearances together, and a column on `matches`. ADR-002 rejected a batch snapshot. Altering `matches` would touch `0002`.

### Seams

- `write` / `read` for `footballMatch` and `appearance`. Catches a column map that drifts from the shared schema, and a row that grows a derived field.
- `CatalogError` code, message, and Zod `cause` on `write`. Catches sport, club, and count rules the shared schema cannot see, and the ones it can.
- `openCatalog` a second time, then `read`. Catches a migration that is not safe to run again.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/12
