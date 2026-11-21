# ui.primitives: Kit primitives and shells

| App | Status | Entry point (user POV)                         | Verify             | Since   |
| --- | ------ | ---------------------------------------------- | ------------------ | ------- |
| ui  | live   | Storybook, port 6006, story Primitives/Gallery | `vp run verify:ui` | GH #175 |

Storybook shows Button, StatusPill, TextField, Drawer, DataTable, and FilterBar shells on kit tokens and `data-*` variants. Story id `primitives--gallery`. Proof text: `Kit primitives`.

#### Sub-features

- `ui.primitives-controls` — Button, StatusPill, TextField.
- `ui.primitives-shells` — Drawer, DataTable, FilterBar (day ‹ ›).

#### How to get to it (user POV)

- Storybook `http://localhost:6006` → Primitives / Gallery.
- Iframe `http://localhost:6006/iframe.html?id=primitives--gallery&viewMode=story`.

#### Driving it with verify

Port 6006 free; Playwright Chromium installed. `vp run verify:ui` — `/index.json` pass, `Primitives/Gallery` pass with `Kit primitives` visible.

#### Gotchas

Studio Angular hosts come later. FilterBar day controls are presentational until Studio wires them.
