# studio.admin: Admin pages and import log

| App    | Status | Entry point (user POV)                     | Verify               | Since         |
| ------ | ------ | ------------------------------------------ | -------------------- | ------------- |
| studio | live   | `http://localhost:4200/admin/competitions` | `vp run studio#test` | plan item 27a |
| studio | live   | `http://localhost:4200/admin/teams`        | `vp run studio#test` | plan item 27b |
| studio | live   | `http://localhost:4200/admin/import`       | `vp run studio#test` | plan item 27c |

An admin manages competitions at `/admin/competitions` through `/api/admin/competitions`. An admin manages football clubs at `/admin/teams` through `/api/admin/teams`. The shell header shows **Admin** only for an admin session. Editors are turned away by `adminGuard`. Guests go to `/login`. Admin pages link to each other in an admin section nav. There is no public club page and the teams screen does not link to one.

An admin reads fixture import runs at `/admin/import` from `GET /api/admin/import/runs` and starts a run with **Run now** (`POST /api/admin/import`). The table shows when each run started (local date and time to the minute, with the original ISO timestamp on the `<time datetime>` attribute), created, updated, and skipped counts, and any error string. Runs are newest first. There is no file upload or schedule control on the page.

Each admin screen uses the same main padding and table styling as **Matches**, stacks each form label above its control, and shows **Competitions**, **Teams**, and **Import** as separate sub-nav links with `aria-current="page"` on the active link.

#### How to get to it (user POV)

- Log in as `admin-demo`, then open `/admin/competitions`, `/admin/teams`, or `/admin/import`, or choose **Admin** in the header (teams page) and use the admin section nav between competitions, teams, and import.
