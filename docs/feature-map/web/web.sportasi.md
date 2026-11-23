# web.sportasi: Sportaši index

| App | Status | Entry point (user POV) | Verify                                | Since |
| --- | ------ | ---------------------- | ------------------------------------- | ----- |
| web | live   | `/sportasi`            | `vp run verify:web --route /sportasi` | #349  |

Public athlete index by sport. `GET /api/public/athletes?sport=` (tennis / football / basketball; default tennis). Rows link to `/athletes/<slug>`. Empty and unavailable copy keep the site shell. No match hubs, MatchCard, or posts/drafts. Sport filter is link navigation (`?sport=`), not ARIA tabs.

Sub-features: sport filter (basketball selectable); athlete list links; empty and unavailable states.

Verify: `vp run verify:web --route /sportasi`; `vp run web#test` for query sport and href seams. Open `/sportasi` or **Sportaši** in the header.
