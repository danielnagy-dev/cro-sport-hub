# studio.admin: Admin pages

| App    | Status | Entry point (user POV)                     | Verify               | Since         |
| ------ | ------ | ------------------------------------------ | -------------------- | ------------- |
| studio | live   | `http://localhost:4200/admin/competitions` | `vp run studio#test` | plan item 27a |
| studio | live   | `http://localhost:4200/admin/teams`        | `vp run studio#test` | plan item 27b |

An admin manages competitions at `/admin/competitions` through `/api/admin/competitions`. An admin manages football clubs at `/admin/teams` through `/api/admin/teams`. The shell header shows **Admin** only for an admin session. Editors are turned away by `adminGuard`. Guests go to `/login`. Admin pages link to each other in an admin section nav. There is no public club page and the teams screen does not link to one.

On the competition and club create and edit forms, Save validates required fields before calling the API: each problem shows a short plain message under that field and focus moves to the first error; a failed save with HTTP 400 or 409 shows the API `message` in an alert region.

The Studio import admin UI (`/admin/import`) is retired. Fixture import runs remain on the API (`POST /api/admin/import`, `GET /api/admin/import/runs`) until a later delete. Each remaining admin screen uses the same main padding and table styling as **Matches**, stacks each form label above its control, and shows **Competitions** and **Teams** as separate sub-nav links with `aria-current="page"` on the active link.

#### How to get to it (user POV)

- Log in as `admin-demo`, then open `/admin/competitions` or `/admin/teams`, or choose **Admin** in the studio section header and use the admin section nav between competitions and teams.
