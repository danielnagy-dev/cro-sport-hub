# studio.tennis-form: Tennis match form with stats

| App    | Status  | Entry point (user POV) | Verify               | Since         |
| ------ | ------- | ---------------------- | -------------------- | ------------- |
| studio | retired | n/a (unregistered)     | `vp run studio#test` | plan item 24b |

**Retired (Phase H / H3b-1 / #277).** Routes unregistered in `app.routes.ts` (#240). Score unit specs removed (#243). Draft-body unit spec, `tennis-form.routes.ts`, and `tennis-score.html` are deleted; `tennis-score.ts` keeps an inline empty template and still imports `draft-body` until #278 stubs the class and #279 deletes `draft-body.ts`. Score stub + `tennis-api` go in #245. Deep links such as `/matches/new/tennis` hit the `**` redirect to Početna.

Formerly: after login, `/matches/new/tennis` loaded editor lookup lists for competitions and tennis players, then saved a new draft with `POST /api/matches/tennis`. `/matches/:id/tennis` loaded the same form from `GET /api/editor/matches/tennis/:id` and saved changes with `PUT /api/matches/tennis/:id`. Client validation used the shared tennis schemas; the Studio layer mapped schema copy to short field messages.
