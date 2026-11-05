# web.home: Latest results home

| App | Status | Entry point (user POV)   | Verify              | Since         |
| --- | ------ | ------------------------ | ------------------- | ------------- |
| web | live   | `http://localhost:3000/` | `vp run verify:web` | plan item 18a |

The public home page lists the latest published tennis and football results. It keeps the skip link, the header link back to `/`, and the heading `Cro Sport Hub` inside `main`. The server calls `GET /api/matches` and renders one `MatchCard` per item, in the API order. The document title and description name tennis and football results. There is no Open Graph image. This replaces the plan 17 placeholder (`web.home-placeholder`).

#### Sub-features

- `web.home-heading` renders the heading inside `main`. `vp run verify:web` proves it, including when the API is down.
- `web.home-skip` offers a skip link to `#content`.
- `web.home-results` renders Sample Player A, Sample Player B, Sample Home, Sample Away, and the football goals, in the fixture order. That proof is the web unit test.
- `web.home-empty` shows `No published results.` when `items` is empty. The heading stays.
- `web.home-unavailable` shows `Results are unavailable.` when the fetch fails. The page does not throw.

#### How to get to it (user POV)

- Open `http://localhost:3000/`.
- The header link returns to this page. Sport pages are `/tennis` and `/football` (see `web.sport`).

#### Driving it with verify

Preconditions: port 3000 is free. Playwright Chromium is installed. The API is not required for the heading.

- **Open home.** Run `vp run verify:web`. The `Home` row is `pass`, the `main` landmark is visible, and the text `Cro Sport Hub` is visible inside it.
- **Cards.** `vp run web#test` renders a fixture page of the seeded final and the seeded league match. A live list needs the API, Docker, and the seed.

#### Gotchas

- `next dev` may write `apps/web/AGENTS.md`. Commit that file unchanged.
- The page calls `http://localhost:3001/api/matches` on the server. It does not call `/api/sports`. The client parses a published page and rejects a `Match` array.
- When the API is down, the heading and `Results are unavailable.` still render, so `verify:web` passes.
- The skip link stays off-screen until it receives focus, so the screenshot shows the header and the heading.
- There is no share image in the repo, so the page sets no `og:image`.
