# web.athlete: Athlete profile and club history

| App | Status | Entry point (user POV) | Verify                                                                                                           | Since         |
| --- | ------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------- |
| web | live   | `/athletes/[slug]`     | `vp run verify:web --route /athletes/<slug>`; visitor walk ends on `sample-player-a` via `vp run verify:visitor` | plan item 19a |

Each athlete page server-renders the public profile from `GET /api/athletes/{slug}`. The shared `AthleteHeader` shows the name, country, sport badge, and optional birth year and position. A clubs section lists each spell by club name and date range, or `No clubs.` when the list is empty. Tennis profiles render each published result with `MatchCard` and, when stats exist, `TennisStats` from the raw counts (percentages come from `tennisPercentages` inside the component). Football profiles render published appearances with `AppearancesTable` from the 8c-shaped `results` array, including `No appearances` when the array is empty. Football profiles do not render a tennis scoreboard. An unknown slug is HTTP 404 via the framework not-found page. Other fetch failures keep the site shell and show `This athlete is unavailable.` The document title is the athlete name. Sport pages link to athletes for that sport via `GET /api/athletes?sport=`.

#### Sub-features

- `web.athlete-header` renders the shared header from `@cro-sport-hub/ui`.
- `web.athlete-clubs` lists club names and from/to dates without catalog ids.
- `web.athlete-tennis-results` renders published tennis matches with `MatchCard` and optional `TennisStats`.
- `web.athlete-football-appearances` renders published football appearances with `AppearancesTable`, including `Second yellow` for two bookings.
- `web.athlete-unavailable` shows `This athlete is unavailable.` when the profile fetch fails.
- `web.athlete-not-found` returns HTTP 404 for an unknown slug.
- `web.sport-athlete-links` on `/tennis` and `/football` link to `/athletes/<slug>` for that sport only.

#### How to get to it (user POV)

- Open `http://localhost:3000/athletes/<slug>` (seed examples: `sample-player-a`, `karlo-brkic`).
- From `/tennis` or `/football`, choose an athlete name in the link list above the results cards.

#### Driving it with verify

Preconditions: port 3000 is free. Playwright Chromium is installed. The API is not required for a 200 response when the API is down.

- **Athlete route.** Run `vp run verify:web --route /athletes/sample-player-a`. The route returns HTTP 200 and shows `This athlete is unavailable.` when the API is down.
- **Visitor walk.** `vp run verify:visitor` ends on Sample Player A with axe on the profile. Requires the API and seed; not part of default CI.
- **Profile contents.** `vp run web#test` stubs profiles and sport athlete lists. Tennis results, football appearances, and stats are covered by the athlete profile unit test with the 8b- and 8c-shaped fixtures. A live profile needs the API and the seed.

#### Gotchas

- The server calls `http://localhost:3001/api/athletes/{slug}`. It parses with `publicAthleteSchema`.
- Sport pages omit the athlete link list when `GET /api/athletes?sport=` fails, but still render match cards.
- `next dev` may write `apps/web/AGENTS.md`. Commit that file unchanged.
