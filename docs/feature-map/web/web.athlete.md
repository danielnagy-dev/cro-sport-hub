# web.athlete: Athlete profile and club history

| App | Status | Entry point (user POV) | Verify                                       | Since         |
| --- | ------ | ---------------------- | -------------------------------------------- | ------------- |
| web | live   | `/athletes/[slug]`     | `vp run verify:web --route /athletes/<slug>` | plan item 19a |

Each athlete page server-renders the public profile from `GET /api/athletes/{slug}`. The shared `AthleteHeader` shows the name, country, sport badge, and optional birth year and position. A clubs section lists each spell by club name and date range, or `No clubs.` when the list is empty. Tennis results and football appearances are not rendered in this slice even when the JSON includes them. An unknown slug is HTTP 404 via the framework not-found page. Other fetch failures keep the site shell and show `This athlete is unavailable.` The document title is the athlete name. Sport pages link to athletes for that sport via `GET /api/athletes?sport=`.

#### Sub-features

- `web.athlete-header` renders the shared header from `@cro-sport-hub/ui`.
- `web.athlete-clubs` lists club names and from/to dates without catalog ids.
- `web.athlete-unavailable` shows `This athlete is unavailable.` when the profile fetch fails.
- `web.athlete-not-found` returns HTTP 404 for an unknown slug.
- `web.sport-athlete-links` on `/tennis` and `/football` link to `/athletes/<slug>` for that sport only.

#### How to get to it (user POV)

- Open `http://localhost:3000/athletes/<slug>` (seed examples: `sample-player-a`, `karlo-brkic`).
- From `/tennis` or `/football`, choose an athlete name in the link list above the results cards.

#### Driving it with verify

Preconditions: port 3000 is free. Playwright Chromium is installed. The API is not required for a 200 response when the API is down.

- **Athlete route.** Run `vp run verify:web --route /athletes/sample-player-a`. The route returns HTTP 200 and shows `This athlete is unavailable.` when the API is down.
- **Profile contents.** `vp run web#test` stubs profiles and sport athlete lists. A live profile needs the API and the seed.

#### Gotchas

- The server calls `http://localhost:3001/api/athletes/{slug}`. It parses with `publicAthleteSchema` but does not render tennis `results`.
- Sport pages omit the athlete link list when `GET /api/athletes?sport=` fails, but still render match cards.
- `next dev` may write `apps/web/AGENTS.md`. Commit that file unchanged.
