# studio.tennis-form: Tennis match form with stats

| App    | Status | Entry point (user POV)                     | Verify                                           | Since         |
| ------ | ------ | ------------------------------------------ | ------------------------------------------------ | ------------- |
| studio | live   | `http://localhost:4200/matches/new/tennis` | `vp run studio#test` and `verify:studio --route` | plan item 24b |

After login, `/matches/new/tennis` loads editor lookup lists for competitions and tennis players, then saves a new draft with `POST /api/matches/tennis`. `/matches/:id/tennis` loads the same form from `GET /api/editor/matches/tennis/:id` and saves changes with `PUT /api/matches/tennis/:id`. The body matches plan 11: set score fields, optional raw stat counts for both players (no percentage fields), and no `status`. Client validation uses the shared tennis schemas; the Studio layer maps schema copy to short field messages (see `apps/studio/src/app/util/match-form-validation-message.ts`) and shows each message beside the field with `aria-describedby`. A successful create shows `Draft saved as <id>` and leaves the form read-only; opening an existing match shows `Status: …` (draft, review, or published) until a save in that visit, not `Draft saved as`. On the edit route, a draft stays editable until save. Editors with a saved draft can call `POST /api/matches/{id}/submit`; success shows status `review` and hides the submit control. The page shows the five percentages from `tennisPercentages` as text (including `No attempts` when a denominator is zero). An unknown id shows `Match not found`. The matches table links tennis rows to `/matches/:id/tennis`.

#### How to get to it (user POV)

- Log in at `http://localhost:4200/login`, then open `http://localhost:4200/matches/new/tennis` or `http://localhost:4200/matches/match-sample-qf/tennis`.
- From the matches table, open a tennis row label link.
- Dev `ng serve` proxies `/api` to `http://localhost:3001`.

#### Driving it with verify

Preconditions: port 4200 is free. Playwright Chromium is installed. The verify CLI does not create a session.

- **Anonymous run.** `vp run verify:studio --route /matches/new/tennis` opens `/login` because `editorGuard` blocks the form.
- **Proof.** `vp run studio#test` stubs HTTP and covers validation, optional stats on the draft body, percentage display, submit for review, reopening a draft with PUT, and a guest redirect. Live save and submit need the API.

#### Gotchas

- Verify has no bearer token, so it cannot prove the editor GET or PUT against a live API.
