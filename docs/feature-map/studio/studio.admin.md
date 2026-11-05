# studio.admin: Admin pages and import log

| App    | Status | Entry point (user POV)                     | Verify               | Since         |
| ------ | ------ | ------------------------------------------ | -------------------- | ------------- |
| studio | live   | `http://localhost:4200/admin/competitions` | `vp run studio#test` | plan item 27a |

An admin manages competitions at `/admin/competitions` through `/api/admin/competitions`. The shell header shows **Admin** only for an admin session. Editors are turned away by `adminGuard`. Guests go to `/login`.

#### How to get to it (user POV)

- Log in as `admin-demo`, then open `/admin/competitions` or choose **Admin** in the header.
