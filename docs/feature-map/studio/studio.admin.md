# studio.admin: Admin pages and import log

| App    | Status | Entry point (user POV)                     | Verify               | Since         |
| ------ | ------ | ------------------------------------------ | -------------------- | ------------- |
| studio | live   | `http://localhost:4200/admin/competitions` | `vp run studio#test` | plan item 27a |
| studio | live   | `http://localhost:4200/admin/teams`        | `vp run studio#test` | plan item 27b |

An admin manages competitions at `/admin/competitions` through `/api/admin/competitions`. An admin manages football clubs at `/admin/teams` through `/api/admin/teams`. The shell header shows **Admin** only for an admin session. Editors are turned away by `adminGuard`. Guests go to `/login`. Admin pages link to each other in an admin section nav. There is no public club page and the teams screen does not link to one.

#### How to get to it (user POV)

- Log in as `admin-demo`, then open `/admin/competitions` or `/admin/teams`, or choose **Admin** in the header (teams page) or open competitions from the admin section nav.
