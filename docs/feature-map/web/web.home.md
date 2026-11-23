# web.home: Početna day list

| App | Status | Entry point (user POV)   | Verify                        | Since |
| --- | ------ | ------------------------ | ----------------------------- | ----- |
| web | live   | `http://localhost:3000/` | `vp run verify:web --route /` | #348  |

Day-focused public home. `main` keeps `Cro Sport Hub`. `GET /api/public/appearances?day=…` (UTC; `?day=` overrides). One row per appearance; national team once. After `startsAt` with no `result`, **u tijeku**; with a result, that label is gone. Day ‹ › steps `day`. Title names Početna; OG/Twitter match home URL. No draft/post/editor fields.

Sub-features: heading; day list (team once, basketball when present); live label; empty and unavailable copy.

Verify: `vp run verify:web --route /`; `vp run web#test` for day seams. Web-local Zod mirrors of `api.public-editorial`. Unavailable copy still renders when the API is down.
