# 19a: Athlete profile page

**What to build:** `/athletes/[slug]` server-renders the profile and club history from 8a. The sport pages link to each athlete from `GET /api/athletes?sport=`. This note is the spec.

**Blocked by:** 8a (`.scratch/athletes/issues/8a-athlete-profile.md`) and 18b (`.scratch/web/issues/18b-sport-pages.md`).

**Status:** ready-for-agent

**Size:** 280 counted lines. One dynamic page, `AthleteHeader`, a club list, and a short link list on the two sport pages.

## Scope

In: `app/athletes/[slug]/page.tsx`. It fetches `GET /api/athletes/:slug`. `AthleteHeader` shows the name, country, sport, and the optional birth year and position. Clubs list the name and the from/to dates. An empty club list shows `No clubs.` Unknown slug is the framework not-found (HTTP 404). A failed fetch shows the shell and `This athlete is unavailable.` The sport pages from 18b each list athletes for that sport as links to `/athletes/<slug>`, using `GET /api/athletes?sport=`. A failed athlete list omits the list and still shows the match cards.

Out: tennis result sections (19b) and the appearances table (19c). No results rendered in this slice even if the JSON already has them. Update `docs/feature-map.md` `web.athlete`. Title is the athlete name.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] `/athletes/sample-player-a` shows Sample Player A, tennis, and `No clubs.`
- [ ] `/athletes/karlo-brkic` shows Karlo Brkić, Sample Town, and Sample Home, with no club id.
- [ ] An unknown slug is HTTP 404. A failed fetch shows `This athlete is unavailable.`
- [ ] `/football` links to `/athletes/karlo-brkic` and does not link to `sample-player-a`. `/tennis` does the opposite for Sample Player A.

## Verification

`vp run verify:web --route /athletes/sample-player-a`. The route returns 200 with the unavailable copy when the API is down. Profile contents are the unit test. Say whether a live API was up.

## Architect

No. The page reads the 8a schema. `AthleteHeader` is already in `libs/ui`. Studio does not import it.

### Seams

- The athlete page with a stubbed profile. Catches a club id on the page, and a thrown fetch.
- The sport-page athlete links. Catches a tennis slug on `/football`.
