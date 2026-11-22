# studio.admin: Admin pages

| App    | Status | Entry point (user POV)              | Verify               | Since         |
| ------ | ------ | ----------------------------------- | -------------------- | ------------- |
| studio | live   | `http://localhost:4200/admin/teams` | `vp run studio#test` | plan item 27b |

An admin manages football clubs at `/admin/teams` through `/api/admin/teams`. The shell header shows **Admin** only for an admin session. Editors are turned away by `adminGuard`. Guests go to `/login`. There is no public club page and the teams screen does not link to one.

On the club create and edit forms, Save validates required fields before calling the API: each problem shows a short plain message under that field and focus moves to the first error; a failed save with HTTP 400 or 409 shows the API `message` in an alert region.

The Studio competitions admin UI (`/admin/competitions`) is retired. Admin competitions remain on the API (`/api/admin/competitions`) until a later delete. The Studio import admin UI (`/admin/import`) is retired. Fixture import runs remain on the API (`POST /api/admin/import`, `GET /api/admin/import/runs`) until a later delete. The remaining admin screen uses the same main padding and table styling as **Matches**, stacks each form label above its control, and shows **Teams** as the admin section nav link with `aria-current="page"` on the active link.

#### How to get to it (user POV)

- Log in as `admin-demo`, then open `/admin/teams`, or choose **Admin** in the studio section header.
