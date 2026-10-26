# 25a: Football score form

**What to build:** An editor enters a football match (competition, round, date, home club, away club, goals) and saves it as a draft. Appearances wait. This note is the spec.

**Blocked by:** 24b (`.scratch/studio/issues/24b-tennis-score-form.md`) and 24a. The tennis form is the pattern. The club list is 24a. `POST` and `PUT /api/matches/football` are on main (plan 11b, PR #24).

**Status:** ready-for-agent

**Size:** 280 counted lines. One signal form, fewer fields than the tennis sets. The shell and the save flow come from 24b.

## Scope

In: `/matches/new/football`, behind `editorGuard`. Fields: competition, date, round, home club, away club, home goals, away goals. Clubs come from `GET /api/editor/teams`. Save sends `POST /api/matches/football` with the plan 11 draft body: no `status`, no `appearances`. The same club on both sides shows the shared-schema message and sends nothing. A successful create keeps the new id on the page. Reopening that draft is 25c.

Out: the edit route (25c), appearance rows and submit (25b). Update `docs/feature-map.md` `studio.football-form`. The matches table does not link here yet.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] A valid score sends `homeTeamId`, `awayTeamId`, and the two goal counts, and sends no `appearances` and no `status`.
- [ ] The same club on both sides sends no request and shows the shared-schema message.
- [ ] Empty required fields send no request.
- [ ] A guest is sent to `/login`.

## Verification

`vp run studio#test`. `vp run verify:studio --route /matches/new/football` lands on login without a session. The form proof is the unit test.

## Architect

No. The football draft body is plan 11. The form adds no schema.

### Seams

- The football form submit, stubbed HTTP. Catches an appearances array on the create body, and a same-club score that is sent.
