# ADR-003: Chromium HTML for slides

## Status

Accepted

## Context

Plan item 28 adds the first template to `libs/slide-generator`: one football slide at 1080×1350. The round-13 handoff (interim, not final) is HTML and CSS rendered to PNG with headless Chrome. Approved colour, type, and layout targets live in [`docs/design-system.md`](../design-system.md) (hero cell size still open). `apps/api`, `apps/studio`, `apps/web`, and `libs/ui` do not render slides. Splitting matches onto slides, and writing the PNG, are the next item. This item chooses the renderer and ships the template.

The handoff depends on CSS the browser fit script used to measure: CSS grid, `font-stretch: 88%` on Archivo, Big Shoulders Display at weights 700, 800, and 900, `zoom` on the list, and a conic-gradient field texture. Both fonts in the handoff are variable files. There is no cover slide.

On 25 Oct 2026 the reference HTML was opened in headless Chrome 156 at 1080×1350. The player hero computed to 278.164px. A four-row list used zoom 1.15. List heroes were 123.504px where the second row has a plain value, and 114.154px where that row is only the passes donut. Big Shoulders Display weight 800 reports a cap height of 0.81em (`measureText("H")` at 100px is 81). The token note "about 278px" matches. The token note "about 107px" does not; the HTML is the authority.

## Decision

`footballTemplate` is a pure function. It returns one HTML document at 1080×1350, plus the hero font sizes it computed. The stacked change adds the list slide and returns that slide's zoom from the same function. The next item rasterizes that HTML with headless Chromium (Playwright). `@playwright/test` 1.64.1 is already in the catalog. ADR-001 leaves its install script off. Chromium is installed with `vp exec playwright install chromium`, the same family as the handoff's `render.sh`. This pull request does not add that call and does not add a dependency. That browser is a large binary on the API server (one process and hundreds of megabytes per render), in CI (the install is explicit because the script stays off), and on macOS, where Playwright's Chromium is not the system browser.

Satori plus resvg is rejected. Current Satori lays out grid, but its readme says unlisted properties are ignored, and it names `fontStretch` as one of those ([vercel/satori README](https://github.com/vercel/satori/blob/main/README.md), read 25 Oct 2026). The same readme says a variable font renders as its default instance, the regular weight. The handoff's names, scores, and stat values are weights 800 and 900 of a variable font, and Archivo is drawn at 88% stretch. A regular-weight render cannot match `png/01-player.png`. Instancing those fonts into static files would be a second build, and the stretch would still be ignored.

A canvas or Skia binding is rejected. It would reimplement the reference CSS, and it would add a native addon to `allowBuilds`, which ADR-001 keeps as an explicit list.

Hero size and list zoom are not left to a browser fit script. List zoom is the token table: 1.15 for four or more rows, 1.3 for three, 1.5 for two or fewer. The league heading is not scaled. Hero size is the handoff's rule, from the cap top of the first-row value to the baseline of the second-row value, divided by the 0.81 cap ratio. Where the second row is only the passes donut, the baseline is that cell's content bottom, which is the reference script's fallback. Name shrink and spare-row padding stay with the PNG item. They need a laid-out height this function does not measure.

List passes are a template option, `donut` (default) or `text`. Hero size is `measured` (default) or `off`, with an optional `heroFontPx` override for the open size question. Navy is the default colourway. Red and light are optional and were not re-reviewed after v1.

## Consequences

Callers pass one player slide. They do not pass a cover. The list slide uses the same HTML document and the same hero rule; it is the stacked change, because the formatted player template plus this ADR plus the handoff already sit at the line budget. The document's font URLs are relative to `design/football-r13/html/`, next to the vendored faces. The PNG item writes the HTML there, or rewrites the URLs, then screenshots it at 1080×1350. Revisit Satori only if it renders these variable-font weights and `font-stretch` and still matches the reference PNG.

On 26 Oct 2026 gallery slides use only fields the catalog already stores. The shirt number is omitted. Stats are text: goals, assists, minutes, and cards. A gallery slide does not draw the donut. Each slide has one optional caption. The round-13 handoff sample that includes a shirt number is unchanged.
