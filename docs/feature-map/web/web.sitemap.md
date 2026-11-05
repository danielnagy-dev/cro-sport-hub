# web.sitemap: Public pages sitemap

| App | Status | Entry point (user POV)              | Verify            | Since         |
| --- | ------ | ----------------------------------- | ----------------- | ------------- |
| web | live   | `http://localhost:3000/sitemap.xml` | `vp run web#test` | plan item 20a |

Next.js serves the App Router sitemap at `/sitemap.xml`. It lists `/`, `/tennis`, `/football`, and `/athletes/<slug>` for each slug from `GET /api/athletes?sport=tennis` and `?sport=football`. Gallery and studio URLs are not included. When an athlete list fetch fails, the response still includes the three static paths and does not fail the build.

#### How to get to it (user POV)

- Open `http://localhost:3000/sitemap.xml` in a browser or HTTP client.

#### Driving it with verify

Preconditions: none for the unit test. A live fetch needs the API on port 3001.

- **Paths.** `vp run web#test` runs `apps/web/tests/sitemap.test.ts` with stubbed athlete lists.
- **Live sitemap.** Optional: start the API and `vp run web#dev`, then request `/sitemap.xml`. Not part of `vp run verify:web`.

#### Gotchas

- The sitemap uses `force-dynamic` like the public pages so slugs are not frozen at build time when the API is available.
- Absolute URLs in the XML use `http://localhost:3000` as the site origin during local development.
