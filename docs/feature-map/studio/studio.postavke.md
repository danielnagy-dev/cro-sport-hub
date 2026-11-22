# studio.postavke: Slot clock times and connected accounts

| App    | Status | Entry point (user POV)           | Verify                                   | Since      |
| ------ | ------ | -------------------------------- | ---------------------------------------- | ---------- |
| studio | live   | `http://localhost:4200/postavke` | `vp run verify:studio --route /postavke` | #199, #217 |

Editor settings behind `editorGuard`. `SettingsApi` for clocks and connected-account stubs. Copy from `core/messages` (`postavke.*`). Guest → `/login`.
