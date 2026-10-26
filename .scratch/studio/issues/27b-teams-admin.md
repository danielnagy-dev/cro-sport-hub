# 27b: Studio teams admin

**What to build:** An admin can list, create, update, and delete clubs from `/admin/teams`. A club that is in use stays. This note is the spec.

**Blocked by:** 13b (`.scratch/admin/issues/13b-teams.md`) and 27a (`.scratch/studio/issues/27a-competitions-admin.md`). The Admin link and `adminGuard` wiring land with 27a.

**Status:** ready-for-agent

**Size:** 260 counted lines. The 27a page again, on `teamSchema` and the 13b routes.

## Scope

In: `/admin/teams` linked from the admin nav 27a added. Fields are the `teamSchema` set the API accepts. The sport is football and the form does not offer a tennis sport. Delete shows `Team is in use` on HTTP 409. There is no public club page and this screen does not link to one.

Out: crests, users, and sports. Extend `studio.admin` in `docs/feature-map.md`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] An admin sees Sample Home, Sample Away, and Sample Town, and can create a club. The POST body parses with `teamSchema`.
- [ ] HTTP 409 `Team is in use` leaves the row on screen.
- [ ] An editor does not see the teams table.
- [ ] The page has no link to a public club URL.

## Verification

`vp run studio#test`. Same login limit as 27a.

## Architect

No. ADR-002 already keeps clubs off the public site. This page is the admin client of 13b.

### Seams

- The teams page, stubbed HTTP. Catches a tennis sport on the create body, a 409 that removes the row, and a link to a public club path.
