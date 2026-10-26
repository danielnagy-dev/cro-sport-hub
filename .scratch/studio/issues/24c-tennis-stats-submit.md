# 24c: Tennis stats and submit for review

**What to build:** The tennis form can record raw stat counts for both players, shows percentages from `tennisPercentages`, and submits a saved draft for review. This note is the spec.

**Blocked by:** 24b (`.scratch/studio/issues/24b-tennis-score-form.md`) and 12a (`.scratch/matches/issues/12a-submit-reject.md`).

**Status:** ready-for-agent

**Size:** 280 counted lines. Optional count inputs on the 24b form, a display of the existing percentage function, and one submit call.

## Scope

In: both players get the raw count fields from `tennisMatchStatsSchema`. They are optional: an empty stats block is omitted from the body. A filled block is validated with `tennisStatIssues` and is not posted while it has an error. The page shows the five percentages from `tennisPercentages` as text. Those numbers are not inputs and are not on the POST body. A zero denominator shows `No attempts`, matching `TennisStats` in `libs/ui`. Studio does not import `libs/ui`; it calls `tennisPercentages` from `libs/shared-types`.

Submit calls `POST /api/matches/:id/submit` only after a draft id exists. The button is available when the local status is `draft`. Success shows status `review` and hides the button. A 409 shows the API message. Extract a `submitMatch(id)` helper the football form (25b) can call.

Out: publish and reject (26a). Football fields. Update `studio.tennis-form` in `docs/feature-map.md`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] A saved draft with both stat blocks posts the raw counts and posts no percentage field.
- [ ] First serve 6 of 10 displays 60%. A zero denominator displays `No attempts`.
- [ ] A stats block that fails `tennisStatIssues` sends no request.
- [ ] Submit with no saved id sends no request. Submit after save calls `POST /api/matches/:id/submit` and the screen shows `review`.
- [ ] Omitting stats still saves the score from 24b.

## Verification

`vp run studio#test`. Verify cannot click submit. The unit test is the proof.

## Architect

No. `tennisPercentages` and `tennisMatchStatsSchema` already exist. The submit route is 12a.

### Seams

- The stats section and the submit control, stubbed HTTP. Catches a percentage on the wire, a zero denominator shown as `0%`, and a submit that fires before a draft id exists.
