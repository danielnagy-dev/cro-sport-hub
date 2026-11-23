# web.athlete: Athlete profile and appearances

| App | Status | Entry point (user POV) | Verify                                                                                                           | Since         |
| --- | ------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------- |
| web | live   | `/athletes/[slug]`     | `vp run verify:web --route /athletes/<slug>`; visitor walk ends on `sample-player-a` via `vp run verify:visitor` | plan item 19a |

Each athlete page server-renders the public-editorial profile from `GET /api/public/athletes/{slug}` via `createApiClient().publicAthlete`. The shared `AthleteHeader` shows the name, country, sport badge, and optional birth year and position. A club section shows `clubName`, or `No club.` when absent. History and upcoming list editorial appearance rows (date, opponent, sport, status, optional result) without `MatchCard` or football appearances-table chrome. Basketball and tennis share that list layout. An unknown slug is HTTP 404 via the framework not-found page. Other fetch failures keep the site shell and show `This athlete is unavailable.` The document title is the athlete name; when the profile loads, metadata includes a short description and Open Graph / Twitter summary fields for `/athletes/<slug>` (no share image).

#### Sub-features

- `web.athlete-header` renders the shared header from `@cro-sport-hub/ui`.
- `web.athlete-club` shows the optional club name without catalog ids.
- `web.athlete-history` lists past and in-progress appearances as editorial rows.
- `web.athlete-upcoming` lists scheduled appearances as editorial rows.
- `web.athlete-unavailable` shows `This athlete is unavailable.` when the profile fetch fails.
- `web.athlete-not-found` returns HTTP 404 for an unknown slug.

#### How to get to it (user POV)

- Open `http://localhost:3000/athletes/<slug>` (seed examples: `sample-player-a`, `karlo-brkic`).
- From Sportaši or day-list links, choose an athlete slug.

#### Driving it with verify

Preconditions: port 3000 is free. Playwright Chromium is installed. The API is not required for a 200 response when the API is down.

- **Athlete route.** Run `vp run verify:web --route /athletes/sample-player-a`. The route returns HTTP 200 and shows `This athlete is unavailable.` when the API is down.
- **Visitor walk.** `vp run verify:visitor` ends on Sample Player A with axe on the profile. Requires the API and seed; not part of default CI.
- **Profile contents.** `vp run web#test` stubs public profiles. History, upcoming, basketball layout, and 404/unavailable seams are covered by the athlete profile unit test. A live profile needs the API and the seed.

#### Gotchas

- The server calls `http://localhost:3001/api/public/athletes/{slug}`. It parses with the web-local `publicAthleteProfileSchema`.
- `next dev` may write `apps/web/AGENTS.md`. Commit that file unchanged.
