# studio.pocetna: Editorial home stub

| App    | Status | Entry point (user POV)          | Verify                                   | Since |
| ------ | ------ | ------------------------------- | ---------------------------------------- | ----- |
| studio | live   | `http://localhost:4200/pocetna` | `vp run studio#test` and `verify:studio` | #199  |

`/` redirects to `/pocetna`. Heading **Početna**, short Croatian stub copy, and `?admin=1` admin message come from `core/messages` (`pocetna.*` keys). Presentational `csh-ui-filter-bar` (day ‹ ›, sport, status) with local signals only — no API filters. Guest → `/login`.
