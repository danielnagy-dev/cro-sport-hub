# studio.football-form: Football match score form

| App    | Status  | Entry point (user POV) | Verify               | Since         |
| ------ | ------- | ---------------------- | -------------------- | ------------- |
| studio | retired | n/a (unregistered)     | `vp run studio#test` | plan item 25a |

**Retired (Phase H / #282–#284, #248).** Routes unregistered in `app.routes.ts` (#240). Score unit spec removed (#246). Draft-body shell deleted (#282). Score stub and `football-form` folder deleted (#248); `football-api.ts` and `match-submit-api.ts` removed with them. Deep links to `/matches/new/football` or `/matches/:id/football` hit the shell `**` redirect to Početna and do not lazy-load this module.

Formerly: after login, `/matches/new/football` chose competition, date, round, clubs, and goals, then saved a draft with `POST /api/matches/football` (no `status` key). Optional appearance rows picked a football athlete, one of the two clubs, and the shared appearance counts; the body included `appearances` only when at least one row was present. `/matches/:id/football` loaded the same form from `GET /api/editor/matches/football/:id` and saved changes with `PUT /api/matches/football/:id`. Submit for review called `POST /api/matches/:id/submit` after a successful save. Shared football schemas drove validation; Studio mapped schema copy to short field messages for the main fields and appearance subfields (see `apps/studio/src/app/util/match-form-validation-message.ts`). A successful create showed `Draft saved as <id>` and locked the form; opening an existing match showed `Status: …` until a save in that visit. On the edit route, a draft stayed editable until save. An unknown id showed `Match not found`. The matches table linked football rows to `/matches/:id/football`.

#### Driving it with verify

- **Anonymous.** Formerly `vp run verify:studio --route /matches/new/football` landed on `/login`.
- **Proof.** `vp run studio#test`. Verify has no bearer.

#### Gotchas

- Published or review matches opened read-only on the edit route until status returned to draft after save.
