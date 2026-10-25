# 05: Match schema

**What to build:** Persist the shared match row and the tennis detail on the catalog seam from ADR-002. Shapes stay `matchSchema`, `tennisMatchSchema`, and `tennisMatchStatsSchema` in `libs/shared-types`. This note is the spec.

**Blocked by:** None. Plan item 4 is merged.

**Status:** resolved

## Scope

In: a match row (the whole shared `Match`, including workflow fields), a tennis match (players, winner, set scores, `bestOf`, `retired`), and tennis stats as raw counts. No percentage columns. Unique `(source, source_ref)`. Two manual rows are allowed: a manual match has no source ref, and Postgres treats those nulls as distinct. Indexes on match `(date, sport id)` and tennis stats `(athlete id)`. New file `0002_v1_matches.sql`, safe to run again. `0001_v1_catalog.sql` is unchanged.

Out, follow-up `.scratch/matches/issues/05b-football-appearances.md` (this pull request does not add that file): `footballMatch` and `appearance` on the same seam, using the shared Zod schemas, with an index on appearance `athleteId`. Blocked by this ticket. No new route, dependency, or shared schema. `docs/feature-map.md` stays unchanged.

## Order

Plan, then architect, then develop. This is a catalog migration, so a separate review agent follows. Daniel squash-merges.

## Acceptance

- [x] A match, tennis match, and stats row read back equal to the shared schema, including a `+02:00` publish time and a 7-6 tiebreak. The stats read has no percentage field.
- [x] A second import with the same source ref is `conflict` / `That record is already stored`. A second manual match is stored.
- [x] A match whose sport is not the competition's sport is `invalid` / `The match sport does not match the competition`.
- [x] Tennis detail on a football match is `invalid` / `A tennis match needs a tennis match`. A football athlete in a tennis match is `invalid` / `Tennis matches are for tennis athletes`.
- [x] Stats for anyone except the two players is `invalid` / `Stats belong to one of the two players`.
- [x] A shared-schema failure is `invalid` / `The record does not match the shared schema`, and the Zod error is `cause`.
- [x] Opening the catalog twice still succeeds after match rows exist.

## Verification

The catalog is not an HTTP route. `vp run verify:api` needs Docker. Proof is the PGLite suite. `verify` is `not run` for that reason.

## Architect

Yes. New tables extend the catalog kinds. No new ADR: ADR-002 already places the rows in `apps/api` and the Zod entities in `libs/shared-types`.

`write` / `read` gain `match`, `tennisMatch`, and `tennisMatchStats`. Stats are read by `{ matchId, athleteId }`. Hidden columns stripped on read: `sportSlug`, `playerASport`, `playerBSport`, `athleteSport`. They exist so a composite foreign key can require a tennis match and tennis athletes.

`publishedAt` is `text`, so `2026-10-23T18:04:00+02:00` round-trips. The set score is `jsonb`, the same nested array as `TennisMatch`. Count relations stay in `tennisStatIssues`. The competition's sport is checked on write. `competitions` is not altered.

Rejected: a second opener, and one write that stores the match and the tennis detail together. ADR-002 rejected a batch snapshot.

### Seams

- `write` / `read` for the three kinds. Catches a column map that drifts from the shared schema, and a stats row that grows a percentage field.
- `CatalogError` code, message, and Zod `cause` on `write`. Catches sport, source-ref, and player rules the shared schema cannot see.
- `openCatalog` a second time, then `read`. Catches a migration that is not safe to run again.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/11
