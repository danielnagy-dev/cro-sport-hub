# 18b: Tennis and football sport pages

**What to build:** `/tennis` and `/football` server-render that sport's published matches. The home header links to both. Each page has its own title and description. This note is the spec.

**Blocked by:** 18a (`.scratch/web/issues/18a-home.md`).

**Status:** resolved

**Size:** 280 counted lines. The 18a list component, twice, plus two metadata objects and two header links.

## Scope

In: `app/tennis/page.tsx` and `app/football/page.tsx`. Each fetches `GET /api/matches/tennis` or `GET /api/matches/football` and uses the same card list as the home page. Empty and failed-fetch copy match 18a. The home header links to `/tennis` and `/football` by those names. `<title>` and the meta description name the sport. No Open Graph image. A path that is not these two files is not a sport page (`/curling` is the existing not-found, not a rendered empty sport).

Out: athlete links (19a adds those on the sport page), the sitemap (20a), and `GET /api/sports`. Update `docs/feature-map.md` `web.sport`. `verify:web` default stays the home heading; add `--route /tennis` and `--route /football` when the author runs it. Those routes must return 200 even when the API is down, because of the failed-fetch copy.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [x] `/tennis` with a fixture page renders the tennis card and does not render Sample Home. `/football` does the opposite.
- [x] The home header links to `/tennis` and `/football`.
- [x] Each document title names its sport. Neither page sets `og:image`.
- [x] A failed fetch on `/football` still returns the heading and `Results are unavailable.`

## Verification

`vp run verify:web --route /tennis --route /football`. Card filtering is the unit test. Live data needs the API. Say which ran.

## Architect

No. Same client and the same `MatchCard` as 18a. Two explicit routes, so `athletes` cannot be captured by a sport segment.

### Seams

- The tennis page and the football page with stubbed fetches. Catches a football card on `/tennis`, and a fetch error that fails the response.
- The home header. Catches a sport name with no link.

## Comments

- https://github.com/danielnagy-dev/cro-sport-hub/pull/39
