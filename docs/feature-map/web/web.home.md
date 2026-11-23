# web.home: Latest results home

| App | Status | Entry point (user POV)   | Verify                                                                             | Since         |
| --- | ------ | ------------------------ | ---------------------------------------------------------------------------------- | ------------- |
| web | live   | `http://localhost:3000/` | `vp run verify:web`; local visitor walk `vp run verify:visitor` (needs API + seed) | plan item 18a |

The public home page lists the latest published tennis and football results. Shared chrome (skip link, brand link to `/`, Croatian **Početna / Sportaši / Reprezentacija** nav) lives in `web.shell`. The heading `Cro Sport Hub` stays inside `main`. The server calls `GET /api/matches` and renders one `MatchCard` per item, in the API order. The document title and description name tennis and football results. Open Graph and Twitter summary metadata use the public site origin with `og:title`, `og:description`, `og:type` (`website`), `og:url`, and `og:site_name`. There is no Open Graph image. This replaces the plan 17 placeholder (`web.home-placeholder`).

#### Sub-features

- `web.home-heading` renders the heading inside `main`. `vp run verify:web` proves it, including when the API is down.
- `web.home-results` renders Sample Player A, Sample Player B, Sample Home, Sample Away, and the football goals, in the fixture order. That proof is the web unit test.
- `web.home-empty` shows `No published results.` when `items` is empty. The heading stays.
- `web.home-unavailable` shows `Results are unavailable.` when the fetch fails. The page does not throw.

#### How to get to it (user POV)

- Open `http://localhost:3000/`, or choose **Početna** in the header.
- Header IA and skip link: `web.shell`. Legacy hub routes `/tennis` and `/football` still exist (`web.sport`) but are not linked from the header.

#### Driving it with verify

Preconditions: port 3000 is free. Playwright Chromium is installed. The API is not required for the heading.

- **Open home.** Run `vp run verify:web`. The `Home` row is `pass`, the `main` landmark is visible, and the text `Cro Sport Hub` is visible inside it.
- **Visitor walk.** Run `vp run verify:visitor` with the API and seed up. The flow opens `/`, follows the tennis nav link, follows Sample Player A, and runs axe on each page. Serious or critical violations fail the run. When the API is down, the athlete link is missing and the task fails.
- **Cards.** `vp run web#test` renders a fixture page of the seeded final and the seeded league match. A live list needs the API, Docker, and the seed.

#### Gotchas

- `next dev` may write `apps/web/AGENTS.md`. Commit that file unchanged.
- The page calls `http://localhost:3001/api/matches` on the server. It does not call `/api/sports`. The client parses a published page and rejects a `Match` array.
- When the API is down, the heading and `Results are unavailable.` still render, so `verify:web` passes.
- The skip link stays off-screen until it receives focus, so the screenshot shows the header and the heading.
- There is no share image in the repo, so the page sets no `og:image`.
