# 13b: Admin teams

**What to build:** An admin can list, create, update, and delete football clubs. A club that is still on a match or a club spell cannot be deleted. There is still no public club page. This note is the spec.

**Blocked by:** None. `teamSchema` and the football-club rule are on main (ADR-002). Can land beside 13a.

**Status:** ready-for-agent

**Size:** 300 counted lines. The same four routes as 13a, on `teamSchema`, without a second error style.

## Scope

In: `GET /api/admin/teams`, `POST /api/admin/teams`, `PUT /api/admin/teams/:id`, and `DELETE /api/admin/teams/:id`. Admin only. The body is `teamSchema`. The catalog already rejects a team whose sport is not football; this handler maps that to HTTP 400 and returns the catalog message. List is name order and is clubs only. Delete of a club that is a side on a match, or that still has an `athlete_teams` row, is HTTP 409 `Team is in use`. Delete of an unused club is HTTP 204. Unknown id is HTTP 404 `Unknown team`. Editor is HTTP 403 `Forbidden`. Missing token is HTTP 401 `Invalid token`. Duplicate id is HTTP 409 with the catalog conflict message. No public `/api/teams`.

Out: crests and photos (the seed has none; `crestUrl` may be omitted). Studio screens are 27b. No national-team column and no club page (ADR-002). No new dependency and no ADR. Update `docs/feature-map.md` with `api.admin-teams`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] An admin creates a club, sees it on the list, and updates `shortName`. The row parses with `teamSchema`.
- [ ] A tennis `sportId` is HTTP 400 and the message is the catalog's football-club message. Nothing is stored.
- [ ] Delete of `club-sample-home` is HTTP 409 `Team is in use`. Delete of a club with no match and no spell is HTTP 204.
- [ ] An editor token is HTTP 403. `/docs-json` has the four admin paths and no `/api/teams`.

## Verification

PGLite HTTP suite. `vp run verify:api` stays on the public GETs. Say that in the results table.

## Architect

No. ADR-002 already places teams in the catalog and keeps them off the public site. This slice is the admin HTTP on that seam.

### Seams

- The four `/api/admin/teams` routes. Catches a tennis club that gets stored, a delete that breaks a match, and a public team route.
- `GET /docs-json`. Catches `/api/teams` or an unsecured admin path.
