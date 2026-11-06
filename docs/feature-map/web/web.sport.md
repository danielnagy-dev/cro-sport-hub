# web.sport: Sport pages (tennis, football)

| App | Status | Entry point (user POV) | Verify                                                | Since         |
| --- | ------ | ---------------------- | ----------------------------------------------------- | ------------- |
| web | live   | `/tennis`, `/football` | `vp run verify:web --route /tennis --route /football` | plan item 18b |

Each sport page server-renders published matches for that sport only. The shared header links to `/tennis` and `/football` with the labels `tennis` and `football`. Both pages reuse the home results list: one `MatchCard` per item, `No published results.` when the page is empty, and `Results are unavailable.` when the fetch fails. The heading inside `main` stays `Cro Sport Hub`. Document titles and descriptions name the sport. Open Graph and Twitter summary metadata include the sport path (`/tennis` or `/football`) and standard tags; there is no Open Graph image.

#### Sub-features

- `web.sport-tennis` calls `GET /api/matches/tennis` and shows tennis cards only.
- `web.sport-football` calls `GET /api/matches/football` and shows football cards only.
- `web.sport-nav` exposes the header links to both routes.
- `web.sport-athlete-links` lists athletes for that sport with links to `/athletes/<slug>` when `GET /api/athletes?sport=` succeeds.

#### How to get to it (user POV)

- Open `http://localhost:3000/tennis` or `http://localhost:3000/football`.
- From any page, choose `tennis` or `football` in the header.

#### Driving it with verify

Preconditions: port 3000 is free. Playwright Chromium is installed. The API is not required; a failed fetch still renders `main`.

- **Sport routes.** Run `vp run verify:web --route /tennis --route /football`. Each route returns HTTP 200 and a visible `main` landmark even when the API is down.
- **Card filtering.** `vp run web#test` stubs each sport endpoint and proves tennis rows omit football teams and the reverse.

#### Gotchas

- Only `/tennis` and `/football` are sport pages. Other paths keep the existing not-found behaviour.
- The server calls `http://localhost:3001/api/matches/tennis` or `/football`, and `http://localhost:3001/api/athletes?sport=tennis` or `?sport=football` for athlete links. It does not call `/api/sports`.
- When the athlete list fetch fails, the page omits the link list and still renders results cards.
