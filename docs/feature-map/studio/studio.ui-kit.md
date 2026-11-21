# studio.ui-kit: Angular hosts for shared kit CSS

| App    | Status | Entry point (user POV)                                        | Verify               | Since   |
| ------ | ------ | ------------------------------------------------------------- | -------------------- | ------- |
| studio | live   | Hosts under `apps/studio/src/app/layout/ui-kit/` (not routed) | `vp run studio#test` | GH #180 |

Thin Angular adapters for Button, StatusPill, TextField, Drawer, DataTable, and FilterBar. They bind documented kit `data-*` values and `csh-*` classes from `@cro-sport-hub/ui` CSS. Studio does not import React from the UI package. Feature templates migrate onto these hosts in a later phase.

#### Sub-features

- `studio.ui-kit-controls` — `CshUiButton`, `CshUiStatusPill`, `CshUiTextField`.
- `studio.ui-kit-shells` — `CshUiDrawer`, `CshUiDataTable`, `CshUiFilterBar` (day ‹ › outputs).

#### How to get to it (user POV)

- Not on a user route yet. Import a host from `apps/studio/src/app/layout/ui-kit/` in a feature template when needed.
- Kit CSS loads with Studio global styles (`tokens.css` + `components.css`).

#### Driving it with verify

`vp run studio#test` covers `data-*` / class seams, Drawer open/close, and FilterBar day outputs. Product `verify:studio` stays unchanged until a routed screen uses the hosts.

#### Gotchas

- Keep local unions in `kit-variants.ts` aligned with `libs/ui/src/variant-contract.ts` by comment; do not import the UI JS barrel into Studio.
- Do not add PrimeNG or Material.
