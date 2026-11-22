# studio.matches: Matches list with filters

| App    | Status  | Entry point (user POV) | Verify               | Since         |
| ------ | ------- | ---------------------- | -------------------- | ------------- |
| studio | retired | n/a (unregistered)     | `vp run studio#test` | plan item 23b |

**Retired (Phase H).** Routes unregistered in `app.routes.ts` (#240). Unit tests removed (#241). Feature folder (`matches.ts` / `matches.html` / `matches.routes.ts`) deleted (#242). `core/matches-api.ts` remains until leftover-clients (#257) because review still imports it. Deep links to `/matches` hit the shell `**` redirect to Početna.

Formerly: after login, `/matches` loaded `GET /api/editor/matches` with sport / status / source filters, an editorial table, and links into tennis-form, football-form, and review.
