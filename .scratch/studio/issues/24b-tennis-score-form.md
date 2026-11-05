# 24b: Tennis score form

**What to build:** An editor enters a tennis match (competition, round, date, two players, set scores, retirement, winner) and saves it as a draft through the plan 11 routes. Stats wait. This note is the spec.

**Blocked by:** 24a (`.scratch/editor/issues/24a-editor-lookups.md`) and 23b (`.scratch/studio/issues/23b-matches-table.md`). `POST /api/matches/tennis` and `PUT /api/matches/tennis/:id` are on main (plan 11b, PR #24).

**Status:** claimed

**Size:** 340 counted lines. One signal form and its tests. Plan 22 was about 941 lines because the session and both guards were in the same diff.

## Scope

In: `/matches/new/tennis`, behind `editorGuard`. Signal forms (`@angular/forms/signals`). Fields: competition and the two players from the 24a lists, date, round, best of 3 or 5, up to five sets (games and an optional tiebreak), retired, and winner. Save sends `POST /api/matches/tennis`. The body is the draft shape plan 11a accepts: no `status`, no `source`, no percentage fields, no `stats`. Client validation uses the shared tennis schemas and shows each message next to the field. An invalid form does not send. A successful create keeps the new id on the page so 24c can submit. Reopening that draft is 24d. This slice does not add a GET-by-id and does not add an edit route.

Out: the edit route and `GET` by id (24d), stat counts and the submit button (24c), football (25a). Do not send a percentage. Update `docs/feature-map.md` `studio.tennis-form`. The matches table does not link here yet; 24d adds the tennis link.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] Submitting empty fields shows the shared-schema messages and sends no request.
- [ ] A valid best-of-3 final sends the tennis draft body plan 11 accepts, with `retired` only when it is set, and with no `stats` and no `status`.
- [ ] A 7-6 set with no tiebreak shows the shared-schema message and sends no request.
- [ ] A successful create keeps the new id on the page. This slice has no edit route and no GET-by-id.
- [ ] A guest is sent to `/login`.

## Verification

`vp run studio#test` with a stubbed HTTP client. `vp run verify:studio --route /matches/new/tennis` redirects to login without a session. The form proof is the unit test. Say that. Live save needs the API.

## Architect

No. The draft body is plan 11. The lookups are 24a. The form does not add a schema.

### Seams

- The tennis form submit, stubbed HTTP. Catches a POST that includes `status` or `stats`, a 7-6 set that is sent, and an empty form that is sent.

## Comments

- https://github.com/danielnagy-dev/cro-sport-hub/pull/46
