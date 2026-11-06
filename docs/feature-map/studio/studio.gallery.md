# studio.gallery: Gallery composer, preview, ZIP

| App    | Status  | Entry point (user POV)             | Verify          | Since |
| ------ | ------- | ---------------------------------- | --------------- | ----- |
| studio | shipped | `/galleries/new`, `/galleries/:id` | `verify:studio` | #56   |

Gallery routes use the same studio section header as the rest of the app (**Galleries** targets `/galleries/new`; there is no gallery list page). Editors pick published football matches on `/galleries/new`, edit one caption per slide on `/galleries/:id`, and preview rendered PNGs via bearer-authenticated blob fetch (object URL, not an API `img` src). On `/galleries/:id`, a gallery in `draft` shows Submit for review (`POST /api/galleries/:id/submit`); that button does not appear for `review` or `published`. An admin on a gallery in `review` sees Reject and Publish (`POST /api/galleries/:id/reject` and `POST /api/galleries/:id/publish`). Editors do not. Neither admin action appears on `draft`. When status is `published`, Download calls `GET /api/galleries/:id/download` with the bearer token and saves a ZIP. Unknown id shows `Gallery not found`. Guests are sent to `/login`.
