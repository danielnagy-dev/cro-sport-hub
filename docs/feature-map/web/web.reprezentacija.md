# web.reprezentacija: Reprezentacija schedule

| App | Status | Entry point (user POV) | Verify                                      | Since |
| --- | ------ | ---------------------- | ------------------------------------------- | ----- |
| web | live   | `/reprezentacija`      | `vp run verify:web --route /reprezentacija` | #351  |

National-team schedule for seeded Croatian teams (`croatia-football`, `croatia-basketball`). `GET /api/public/national-teams/{slug}/schedule` via the public api-client. Sport filter is `?sport=`; only sports with a seeded team appear. Buckets: past, current, upcoming. Empty buckets show calm empty copy; no MatchCard. Unavailable copy when the API is down. No posts, drafts, or editor chrome.

#### How to get to it (user POV)

- Choose **Reprezentacija** in the header, or open `http://localhost:3000/reprezentacija`.
- Switch sport with the filter links (`?sport=football` / `?sport=basketball`).

#### Driving it with verify

- `vp run verify:web --route /reprezentacija` — `main` with heading `Reprezentacija` and past/current/upcoming sections.
