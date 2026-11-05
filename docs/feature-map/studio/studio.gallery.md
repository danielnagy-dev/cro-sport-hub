# studio.gallery: Gallery composer, preview, ZIP

| App    | Status  | Entry point (user POV)             | Verify          | Since |
| ------ | ------- | ---------------------------------- | --------------- | ----- |
| studio | shipped | `/galleries/new`, `/galleries/:id` | `verify:studio` | #56   |

Editors pick published football matches on `/galleries/new`, edit one caption per slide on `/galleries/:id`, and preview rendered PNGs via bearer-authenticated blob fetch (object URL, not an API `img` src). Reject, publish, and ZIP are a later change.
