# 13a: Admin competitions

**What to build:** An admin can list, create, update, and delete competitions. A competition that still has a match cannot be deleted. Editors cannot call these routes. This note is the spec.

**Blocked by:** None. `competitionSchema`, catalog `write` / `read`, and `AdminGuard` are on main (plan items 4 and 10).

**Status:** ready-for-agent

**Size:** 320 counted lines. Four routes on a catalog kind that already validates. Plan 11b was about 410 lines because the draft body was new; this one reuses `competitionSchema`.

## Scope

In: `GET /api/admin/competitions`, `POST /api/admin/competitions`, `PUT /api/admin/competitions/:id`, and `DELETE /api/admin/competitions/:id`. Admin only. The body is `competitionSchema` (`id`, `sportId`, `name`, `season`, `level`). List returns every competition, name order. Create and update return the stored row. A second id is HTTP 409 with the catalog conflict message. A sport id that is not a sports row is HTTP 400 with the catalog message. Delete of a competition that still has a match is HTTP 409 `Competition is in use` and the row stays. Delete of an unused competition is HTTP 204. Unknown id on update or delete is HTTP 404 `Unknown competition`. A missing token is HTTP 401 `Invalid token`. An editor token is HTTP 403 `Forbidden`. OpenAPI marks the four paths with bearer security. There is no public competitions route.

Out: sports and users. Sport admin is out of v1. ADR-002 stays: callers do not insert sports, and tennis and football remain the seeded pair. User admin is out of v1. ADR-004 stays: the only accounts are `editor-demo` and `admin-demo`, and passwords come from the environment. Teams are 13b. The studio screens are 27a. No new dependency and no ADR. Do not edit `0001`–`0005`. Update `docs/feature-map.md` with `api.admin-competitions`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] An admin creates a competition, reads it back from the list, and updates the name. The stored row parses with `competitionSchema`.
- [ ] Delete of `comp-sample-cup` is HTTP 409 `Competition is in use` and the Sample Cup row remains.
- [ ] Delete of a competition with no matches is HTTP 204 and a later read misses it.
- [ ] An editor token is HTTP 403 on all four routes. A missing token is HTTP 401.
- [ ] `/docs-json` documents the four paths and no public `/api/competitions`.

## Verification

PGLite HTTP suite. `vp run verify:api` does not send an admin token. Say that in the results table.

## Architect

No. `competitionSchema` and the catalog seam already own the shape. `AdminGuard` is plan 10. Apps other than the API do not see this module.

### Seams

- The four `/api/admin/competitions` routes on PGLite. Catches an editor who writes, a delete that orphans a match, and a body the shared schema would reject.
- `GET /docs-json`. Catches a public competitions path, or an admin path with no bearer scheme.
