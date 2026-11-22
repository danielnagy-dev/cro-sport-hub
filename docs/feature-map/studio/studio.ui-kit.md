# studio.ui-kit: Angular hosts for shared kit CSS

| App    | Status | Entry point (user POV)                                        | Verify               | Since   |
| ------ | ------ | ------------------------------------------------------------- | -------------------- | ------- |
| studio | live   | Hosts under `apps/studio/src/app/layout/ui-kit/` (not routed) | `vp run studio#test` | GH #180 |

Thin Angular adapters for Button, StatusPill, TextField, Drawer, DataTable, and FilterBar. They bind documented kit `data-*` values and `csh-*` classes from `@cro-sport-hub/ui` CSS. Studio does not import React from the UI package. Početna and Objave use `CshUiFilterBar` as presentational chrome; other hosts migrate as editorial lists land.

#### Sub-features

- `studio.ui-kit-controls` — `CshUiButton`, `CshUiStatusPill`, `CshUiTextField`.
- `studio.ui-kit-shells` — `CshUiDrawer`, `CshUiDataTable`, `CshUiFilterBar` (day ‹ › outputs).

#### How to get to it (user POV)

- Import a host from `apps/studio/src/app/layout/ui-kit/` in a feature template. FilterBar is on `/pocetna` and `/objave` (see `studio.pocetna`, `studio.objave`).
- Kit CSS loads with Studio global styles (`tokens.css` + `components.css`).

#### Driving it with verify

`vp run studio#test` covers `data-*` / class seams, Drawer open/close, and FilterBar day outputs. Anonymous `verify:studio --route /pocetna` lands on login; signed-in screenshots need a session.

#### Gotchas

- Keep local unions in `kit-variants.ts` aligned with `libs/ui/src/variant-contract.ts` by comment; do not import the UI JS barrel into Studio.
- Do not add PrimeNG or Material.
