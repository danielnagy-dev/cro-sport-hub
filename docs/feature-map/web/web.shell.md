# web.shell: Public site chrome

| App | Status | Entry point (user POV) | Verify                                                                  | Since |
| --- | ------ | ---------------------- | ----------------------------------------------------------------------- | ----- |
| web | live   | every public page      | `vp run verify:web --route / --route /sportasi --route /reprezentacija` | #347  |

Shared App Router chrome: skip link to `#content`, brand home link to `/`, and Croatian primary nav **Početna / Sportaši / Reprezentacija**. Strings come from `apps/web/lib/messages` (HR default). Header no longer links to `/tennis` or `/football` (hub removal is a sibling ticket).

#### Sub-features

- `web.shell-skip` — skip link labelled `Preskoči na sadržaj`.
- `web.shell-nav` — three HR section links; no tennis/football hub links.
- `web.shell-brand` — brand link to `/` labelled `Cro Sport Hub`.

#### How to get to it (user POV)

- Open any public route. The header is on every page via the root layout.

#### Driving it with verify

- `vp run verify:web --route / --route /sportasi --route /reprezentacija` — each route HTTP 200 with `main`.
- `vp run web#test` — shell unit tests assert HR labels and absence of hub links.

#### Gotchas

- Document `lang` is `hr`. Runtime stays HR-only; catalog keys are shaped for a later second locale.
- `/sportasi` content is `web.sportasi`. `/reprezentacija` content lands in a sibling ticket.
