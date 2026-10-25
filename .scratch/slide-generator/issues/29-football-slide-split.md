# 29: Split football matches into slides

**What to build:** Turn a set of fictional football appearances into the round-13 slide sequence, then rasterize each slide to a 1080×1350 PNG with the headless Chromium renderer from ADR-003. There is no cover slide.

**Blocked by:** Plan item 28. The player slide (PR #13) and the list slide (PR #16) are on main.

**Status:** resolved

## Scope

In: grouping appearances into player and list slides, chunking a list at six rows, and rendering those slides to PNG. `@playwright/test` is the catalog package ADR-003 already chose. Chromium itself stays an explicit install (`vp exec playwright install chromium`). No Docker.

Out: a cover slide, name shrink, spare-row padding, a pixel diff against the reference PNGs, `apps/api`, and `docs/feature-map.md`. Nothing a user can open changes. Packing two leagues onto one slide is out: a list slide has one heading.

## Order

Plan, then develop. No new ADR and no new dependency family. Pre-launch is a self-review. Daniel squash-merges.

## Acceptance

- [x] No appearances produce no slides
- [x] One appearance in a round (competition, round, and date) is a player slide
- [x] Two to six appearances in one round are one list, in input order
- [x] Exactly six rows stay one list. A seventh overflows onto a second list. The leftover stays a list
- [x] The handoff sample is Karlo Brkić's player slide, then one Serie A list of Filip Šarić, Mateo Jurčić, Leon Vuković, and Bruno Perić
- [x] Each slide renders to a PNG whose header is 1080×1350, with the round-13 faces loaded
- [x] With Chromium missing, the render test skips and names `vp exec playwright install chromium`. An empty render does not launch a browser

## Verification

`vp run verify:api|studio|web|ui` is not applicable (no user-reachable route; slide-generator has no verify target). Run format-check, lint, guards, pr-body, typecheck, test, and build.

## Architect

No. ADR-003 already chose headless Chromium for this item. The package depends on the catalog `@playwright/test`. `@types/node` is a devDependency so the renderer can read the vendored fonts. Shared types stay out: a catalog appearance has no shots, passes, or names, and this library does not read the API.

## Seams

- `footballSlides(entries)` — appearances in, slide sequence out. Catches an empty set, a six-row list, overflow past six, and the handoff order. It does not catch pixels.
- `renderFootballPngs(slides)` — slides in, PNG bytes out. Catches the 1080×1350 header and that the round-13 faces loaded. It skips in CI when the Chromium binary is absent. It does not catch a pixel match against the reference PNG.

## Comments

https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/17
