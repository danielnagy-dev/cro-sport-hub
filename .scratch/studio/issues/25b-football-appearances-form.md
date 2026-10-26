# 25b: Football appearances and submit

**What to build:** The football form records appearances for tracked athletes and submits the draft for review with the helper from 24c. This note is the spec.

**Blocked by:** 25a (`.scratch/studio/issues/25a-football-score-form.md`) and 24c (`.scratch/studio/issues/24c-tennis-stats-submit.md`).

**Status:** ready-for-agent

**Size:** 320 counted lines. A repeating appearance row on the 25a form, validated by `appearanceSchema`, plus the submit call 24c already extracted.

## Scope

In: zero or more appearance rows. Each row picks an athlete from `GET /api/editor/athletes?sport=football`, a club that is one of the two sides, and the `appearanceSchema` fields (`started`, `minutes`, `goals`, `assists`, `yellowCards`, `redCard`). The shared issues show next to the row. A goal with zero minutes sends nothing. The same athlete twice sends nothing. The body includes `appearances` only when at least one row is present. Submit uses `submitMatch(id)` from 24c and follows the same draft-id rule. Success shows `review`.

Out: the review screen (26a). Update `studio.football-form` in `docs/feature-map.md`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] A score with one appearance posts that appearance's counts and posts no derived field.
- [ ] Zero minutes and a goal shows the shared-schema message and sends nothing. The same athlete on two rows sends nothing.
- [ ] A score with no appearance rows still saves, and the body has no `appearances` key.
- [ ] Submit after save calls `POST /api/matches/:id/submit`. Submit with no id sends nothing.

## Verification

`vp run studio#test`. Verify cannot complete the form. The unit test is the proof.

## Architect

No. `appearanceSchema` is already shared. Submit is 12a via the 24c helper.

### Seams

- The appearances editor, stubbed HTTP. Catches a zero-minute goal on the wire, a repeated athlete, and a submit before save.
