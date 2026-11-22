# studio.objave: Publish-slot list and week filters

| App    | Status | Entry point (user POV)         | Verify                                             | Since      |
| ------ | ------ | ------------------------------ | -------------------------------------------------- | ---------- |
| studio | live   | `http://localhost:4200/objave` | `vp run verify:studio --route /objave` (signed-in) | #199, #221 |

Objave behind `editorGuard`. Day chrome via presentational `csh-ui-filter-bar`; status select and week chips filter `PublishSlotsApi.listForDay`. Row opens shared `csh-publish-slot-drawer` (text/order/approve) without route change. Copy from `core/messages` (`objave.*`). Guest → `/login`.
