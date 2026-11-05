# 23b: Studio matches table

**What to build:** `/matches` shows the editorial list in a keyboard-usable table with filters for sport, status, and source. The shell stub stays. This note is the spec.

**Blocked by:** 23a (`.scratch/editor/issues/23a-editor-match-list.md`). Studio login, `editorGuard`, and the router are on main (plan 22, PR #23).

**Status:** claimed

## Comments

- https://github.com/danielnagy-dev/cro-sport-hub/pull/42

**Size:** 320 counted lines. One route, one table, three native filters, and the HTTP tests. Plan 22 was about 941 lines because it included the session and both guards.

## Scope

In: route `/matches`, `editorGuard`, fetching `GET /api/editor/matches` with the bearer the login slice already attaches. Filters are native `<select>` elements for sport, status, and source, including an All option. Changing a filter reloads the query. The table columns are label, sport, competition, date, round, status, and source. The caption names the list. Row links can wait until 24b adds the edit route; this slice's rows are not required to navigate. Tab order reaches each select and then the table. Empty results show `No matches.` A failed load shows `The match list could not be loaded.` and leaves the filters usable. The shell at `/` keeps its stub list so the existing studio check still has a match row until that check is updated by plan 22. Add a `Matches` link in the shell header.

Out: the tennis form, the football form, and removing the stub. Signal forms are not needed for three selects. Update `docs/feature-map.md` `studio.matches`. `vp run verify:studio --route /matches` after login is the live check; the unit test stubs the HTTP call so it does not need the API.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] With a stubbed page of the seeded final and the draft quarterfinal, the table shows both labels and both statuses.
- [ ] Choosing `draft` requests `status=draft`. Choosing football requests `sport=football`.
- [ ] An empty page shows `No matches.` A failed request shows `The match list could not be loaded.`
- [ ] The selects and the table are reachable with the keyboard. The control type is a native select and a native table.
- [ ] A guest is sent to `/login`. The `/` stub list still renders its match row in the shell unit test.

## Verification

`vp run studio#test` for the table. `vp run verify:studio --route /matches` needs a signed-in session, which the verify CLI does not create. The unit test is the proof for filters and the empty state. Say that verify opened the login page if the route redirected. Update `studio.matches`.

## Architect

No. The page is a client of 23a. It uses the session from plan 22. It does not import `libs/ui`.

### Seams

- The matches page with `HttpTestingController`. Catches a filter that is not sent, a draft missing from an unfiltered stub, and a guest who sees the table.
