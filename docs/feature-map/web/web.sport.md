# web.sport: Sport hubs (retired)

| App | Status  | Entry point (user POV) | Verify                                                                            | Since |
| --- | ------- | ---------------------- | --------------------------------------------------------------------------------- | ----- |
| web | retired | `/tennis`, `/football` | `vp run verify:web --route /tennis --route /football --route / --route /sportasi` | #352  |

Public `/tennis` and `/football` content hubs are removed. Both paths permanently redirect to Početna (`/`) via `next.config.ts` (`retiredSportHubRedirects`). Sportaši is not yet the primary discovery surface, so deep links land on home rather than `/sportasi`. The App Router no longer ships hub page modules. The public header never linked here after `web.shell`.

#### Sub-features

- `web.sport-redirect` — permanent redirects `/tennis` → `/` and `/football` → `/`.
- Former `web.sport-tennis` / `web.sport-football` / `web.sport-athlete-links` match-card hubs are gone with the page modules.

#### How to get to it (user POV)

- Opening `http://localhost:3000/tennis` or `http://localhost:3000/football` follows a permanent redirect to Početna. There is no header link.

#### Driving it with verify

Preconditions: port 3000 is free. Playwright Chromium is installed.

- **Redirects.** Run `vp run verify:web --route /tennis --route /football --route / --route /sportasi`. Hub routes land on Početna (`main` with `Cro Sport Hub`). `/` and `/sportasi` still verify.
- **Config / sitemap.** `vp run web#test` asserts redirect sources/destinations and that `staticPublicPaths` omits `/tennis` and `/football`. Athlete profile URLs remain in the sitemap from sport athlete lists.

#### Gotchas

- Redirects are permanent (`permanent: true`). Prefer updating bookmarks to `/` or later `/sportasi` when that index ships.
- Sitemap static paths are `/` only; hub URLs are not advertised. Athlete slugs still come from `GET /api/athletes?sport=tennis` and `?sport=football`.
- Do not reintroduce tennis/football hub links in `shell.tsx`.
