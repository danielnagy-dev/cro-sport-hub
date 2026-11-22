# studio.admin: Admin pages

| App    | Status  | Entry point (user POV)                                                | Verify               | Since         |
| ------ | ------- | --------------------------------------------------------------------- | -------------------- | ------------- |
| studio | retired | `/admin/teams`, `/admin/competitions`, `/admin/import` (unregistered) | `vp run studio#test` | plan item 27b |

**Retired (Phase H / #253–#256).** Admin routes are unregistered in `app.routes.ts` (#240). Deep links such as `/admin/teams`, `/admin/competitions`, and `/admin/import` hit the `**` redirect to Početna. Studio no longer ships the admin feature folder (`teams-admin`, `admin.routes.ts`), `core/teams-admin-api.ts`, or import/competitions admin UI. Admin teams and competitions remain on the API (`/api/admin/teams`, `/api/admin/competitions`) until later deletes (#265–#266). Fixture import runs remain on the API until #267.

#### How to get to it (user POV)

- Deep links to former admin paths redirect to Početna (then login without a session). There is no Admin header shortcut.
