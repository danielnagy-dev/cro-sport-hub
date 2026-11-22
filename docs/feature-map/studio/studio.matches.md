# studio.matches: Matches list with filters

| App    | Status  | Entry point (user POV) | Verify               | Since         |
| ------ | ------- | ---------------------- | -------------------- | ------------- |
| studio | retired | n/a (unregistered)     | `vp run studio#test` | plan item 23b |

**Retired (Phase H).** Routes unregistered in `app.routes.ts` (#240). Unit tests for the list (`matches.spec.ts`) are removed (#241). Feature folder sources (`matches.ts` / `matches.html` / `matches.routes.ts`) and `matches-api` remain on disk until sibling delete tickets (#242 / later). Deep links to `/matches` hit the shell `**` redirect to Početna and do not lazy-load this module.

Formerly: after login, `/matches` loaded `GET /api/editor/matches` with sport / status / source filters, an editorial table, and links into tennis-form, football-form, and review.
