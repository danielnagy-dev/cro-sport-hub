# 24a: Editor lookups for the forms

**What to build:** An editor can list competitions, athletes, and clubs to fill a match form. The lists are ids and names. This note is the spec.

**Blocked by:** None. `EditorGuard` and the catalog rows are on main. The forms that consume the lists are 24b and 25a.

**Status:** resolved

**Size:** 260 counted lines. Three small selects and the guard tests. No new validation beyond the sport query.

## Scope

In: `GET /api/editor/competitions?sport=tennis|football` returns `{ id, name, season }[]`, name order, for that sport only. `GET /api/editor/athletes?sport=` returns `{ id, name }[]`, name order. `GET /api/editor/teams` returns `{ id, name }[]` for football clubs only. A missing or unknown sport on the first two routes is HTTP 400 `Unknown sport`. Editor or admin. Missing token is HTTP 401 `Invalid token`. Any other role is HTTP 403 `Forbidden`. No paging (v1 has at most 10 athletes per sport). No public copies of these paths. OpenAPI marks them with bearer security.

Out: create and update (13a and 13b), the forms, and stats. No new dependency and no ADR. Update `docs/feature-map.md` with `api.editor-lookups`.

## Order

Plan is this note. Architect sketches the three lookup schemas in `libs/shared-types`, then develop. No ADR. The author self-reviews. Daniel squash-merges.

## Acceptance

- [x] An editor token on `?sport=tennis` returns Sample Cup and the four Sample Players, and returns no football club and no footballer.
- [x] `?sport=football` returns Sample League and the five footballers. `GET /api/editor/teams` returns Sample Home, Sample Away, and Sample Town.
- [x] `?sport=curling` is HTTP 400 `Unknown sport`. No token is HTTP 401.
- [x] `/docs-json` documents the three paths as secured, and documents no public `/api/teams`.

## Verification

PGLite HTTP suite. Verify's GET has no bearer, so these routes are not `--route` checks. Say that.

## Architect

Yes, for the three lookup schemas in `libs/shared-types`. No ADR. They are id-and-name projections of schemas that already exist.

### Seams

- The three `GET /api/editor/...` routes on the seeded catalog. Catches a footballer on the tennis list, and a list that omits the id the form must post.
- `GET /docs-json`. Catches an unsecured lookup.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/29
