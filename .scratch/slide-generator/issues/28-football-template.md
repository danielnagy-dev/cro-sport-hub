# 28: Football slide template

**What to build:** ADR-003 chooses headless Chromium HTML as the slide renderer. `footballTemplate` in `libs/slide-generator` turns one player slide into a 1080×1350 HTML document. Hero size comes from the round-13 tokens. The handoff is vendored under `libs/slide-generator/design/football-r13/` and marked interim. The list slide is the stacked change: the formatted player template, the ADR, and the handoff already use the line budget.

**Blocked by:** none. Plan #2 left the package in place. The round-13 handoff is vendored in this change.

**Status:** claimed

## Scope

In: the renderer ADR, the player slide, hero-size options, and the round-13 design files. The stylesheet includes the list selectors so the stacked change does not rewrite it.

Out: the list slide (stacked, same plan item), splitting matches onto slides, PNG output, a cover slide, and `apps/api` (plan #5 is in progress there). `docs/feature-map.md` stays as it is. Nothing a user can open changes.

## Order

Plan, then architect (ADR-003, new renderer), then develop. A separate review follows because this is an ADR. This run does not launch it. Daniel squash-merges.

## Acceptance

- [x] A player slide reports 1080×1350 and `13-interim`
- [x] The example player hero rounds to 278px, passes read 78% and 25/32, and shots read 5 (3)
- [x] Hero measurement can be turned off, and `heroFontPx` overrides the measured size
- [x] Navy is the default. Red and light are optional
- [x] A cover kind throws. No cover layout is invented
- [x] Sample names stay the fictional handoff data
- [ ] List zoom, the mini donut, and the text passes option wait for the stacked change

## Verification

`vp run verify:api|studio|web|ui` is not applicable (no user-reachable route; slide-generator has no verify target). Run format-check, lint, guards, pr-body, typecheck, test, and build.

## Architect

Yes. New renderer, and the template is the first behaviour in `libs/slide-generator`.

## Seams

- `footballTemplate(slide, options)` — one player slide in, one document out. Catches size, hero size, colourway, and the missing cover. It does not catch pixel match against the reference PNG. That waits for the PNG item. The list slide joins this seam in the stacked change.

## Comments

Player slice: https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/13
