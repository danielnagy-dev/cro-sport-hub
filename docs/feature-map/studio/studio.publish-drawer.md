# studio.publish-drawer: Shared publish-slot drawer

| App    | Status | Entry point (user POV)                                                    | Verify                                                 | Since |
| ------ | ------ | ------------------------------------------------------------------------- | ------------------------------------------------------ | ----- |
| studio | live   | `csh-publish-slot-drawer` in `layout/publish-slot-drawer/` (no own route) | `vp run studio#test`; `verify:studio` + signed-in host | #215  |

Shared drawer on `csh-ui-drawer` plus `core/publish-slots-api.ts`. Temporary Početna **Pregledaj** harness until F1.
