# 27a: Studio competitions admin

**What to build:** An admin can list, create, update, and delete competitions from `/admin/competitions`. Editors are turned away. This note is the spec.

**Blocked by:** 13a (`.scratch/admin/issues/13a-competitions.md`) and 26a (`.scratch/studio/issues/26a-review-screen.md`). `adminGuard` is on main (plan 22, PR #23). The original item waits until the review flow exists.

**Status:** ready-for-agent

**Size:** 300 counted lines. One admin page on the 13a routes. Plan 22 already paid for the guard.

## Scope

In: `/admin/competitions`, `adminGuard`. A table of name, season, level, and sport. A signal form creates and updates through the 13a routes. Delete asks the browser to confirm, then calls DELETE. HTTP 409 `Competition is in use` is shown and the row stays. The shell header shows an Admin link only when the session role is admin. An editor who opens the URL is refused by `adminGuard` (sent to the shell, not shown the table).

Out: teams (27b), import (27c), users, and sports. Update `docs/feature-map.md` `studio.admin`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] An admin sees Sample Cup and Sample League and can create a competition. The POST body parses with `competitionSchema`.
- [ ] Delete of a stubbed in-use competition shows `Competition is in use` and the row remains.
- [ ] An editor session does not see the Admin link and does not see the table at `/admin/competitions`.
- [ ] A guest is sent to `/login`.

## Verification

`vp run studio#test`. Verify without a session lands on login. The table and the 409 are the unit test.

## Architect

No. The HTTP API is 13a. The page adds no schema.

### Seams

- The competitions page, stubbed HTTP, for admin and editor sessions. Catches an editor who sees the form, and a 409 that drops the row from the table.
