# studio.pocetna: Editorial home dashboard

| App    | Status | Entry point (user POV)          | Verify                                   | Since      |
| ------ | ------ | ------------------------------- | ---------------------------------------- | ---------- |
| studio | live   | `http://localhost:4200/pocetna` | `vp run studio#test` and `verify:studio` | #199, #219 |

`/` redirects to `/pocetna`. Authenticated editors see next-slot card (`GET /api/editor/publish-slots/next`), athletes-for-day list (`GET /api/editor/appearances?day=`), and posts for the selected day (`GET /api/editor/publish-slots?day=`). Presentational `csh-ui-filter-bar` day ‹ › reloads both lists; sport/status signals filter appearances (sport) and posts (status + slide ∩ day appearances). National-team appearances stay one row. Post row / **Pregledaj** opens shared `csh-publish-slot-drawer` without a route change; **Odobri i objavi** calls approve. Guest → `/login`. Copy: `pocetna.*` in `core/messages`.
