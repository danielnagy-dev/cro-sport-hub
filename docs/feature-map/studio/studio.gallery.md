# studio.gallery: Gallery composer, preview, ZIP

| App    | Status  | Entry point (user POV)             | Verify          | Since |
| ------ | ------- | ---------------------------------- | --------------- | ----- |
| studio | retired | `/galleries/new`, `/galleries/:id` | `verify:studio` | #56   |

**Retired (Phase H / #251).** Gallery routes are unregistered in `app.routes.ts` (#240). Deep links such as `/galleries/new` and `/galleries/:id` hit the `**` redirect to Početna. Specs, `gallery-new`, `gallery-shell`, and `gallery.routes` are deleted; `gallery.ts` and `core/gallery-api.ts` remain until #252.

Gallery routes used the same studio section header as the rest of the app (**Galleries** targeted `/galleries/new`; there was no gallery list page). Editors picked published football matches on `/galleries/new` (match list in a fieldset with the shared form spacing), edited one caption per slide on `/galleries/:id` (status and actions on one row; caption above the button row; preview scaled to the content width), and previewed rendered PNGs via bearer-authenticated blob fetch (object URL, not an API `img` src). On `/galleries/:id`, a gallery in `draft` showed Submit for review (`POST /api/galleries/:id/submit`); that button did not appear for `review` or `published`. An admin on a gallery in `review` saw Reject and Publish (`POST /api/galleries/:id/reject` and `POST /api/galleries/:id/publish`). Editors did not. Neither admin action appeared on `draft`. When status was `published`, Download called `GET /api/galleries/:id/download` with the bearer token and saved a ZIP. Unknown id showed `Gallery not found`. Guests were sent to `/login`.
