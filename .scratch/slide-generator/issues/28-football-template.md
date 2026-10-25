# 28: Football slide template

**What to build:** ADR-003 chooses headless Chromium HTML as the slide renderer. `footballTemplate` in `libs/slide-generator` turns one player slide into a 1080×1350 HTML document. Hero size comes from the round-13 tokens. The handoff is vendored under `libs/slide-generator/design/football-r13/` and marked interim. The list slide is the stacked change: the formatted player template, the ADR, and the handoff already use the line budget.

**Blocked by:** none. Plan #2 left the package in place. The round-13 handoff is vendored in this change.

**Status:** resolved

## Scope

In: the renderer ADR, the player slide, the list slide, hero-size options, and the round-13 design files. The list stylesheet was already on the player slice. This slice fills it in.

Out: splitting matches onto slides, PNG output, a cover slide, and `apps/api`. `docs/feature-map.md` stays as it is. Nothing a user can open changes. A browser pixel diff waits for the PNG item: CI does not install Chromium (ADR-003).

## Order

Plan, then architect (ADR-003, new renderer), then develop. The ADR review was the player slice. This list slice adds no schema, dependency, or ADR, so pre-launch is a self-review. Daniel squash-merges.

## Acceptance

- [x] A player slide reports 1080×1350 and `13-interim`
- [x] The example player hero rounds to 278px, passes read 78% and 25/32, and shots read 5 (3)
- [x] Hero measurement can be turned off, and `heroFontPx` overrides the measured size
- [x] Navy is the default. Red and light are optional
- [x] A cover kind throws. No cover layout is invented
- [x] Sample names stay the fictional handoff data
- [x] A four-row list reports zoom 1.15, text passes (`84%` and `38/45`), and the round-13 hero sizes
- [x] Two rows zoom to 1.5 and three rows zoom to 1.3. More than six players throws
- [x] List values paint at 34px on a 1.0 line, not 0.82× the size

## Part 2 decisions (25 Oct 2026)

List passes are text only. The percent is the 34px value and the fraction sits under it at 12px. There is no list donut, and no `donut` option. The player donut stays.

Hero size stays the round-13 measurement. A plain second row is about 123.5px. A text pass in the first row adds the 16px fraction stack (4px gap + 12px line), which is Filip's 143.2px hero. The sizes are not shrunk.

The donut-only row-2 fallback (114px) is not needed. That path used the cell's content bottom when the second row had no value baseline. Text passes have a percent baseline, so the plain rule covers them. Bruno's second row is only `80%` / `16/20` and measures 123.5px on the no-donut handoff, the same as a plain value. The fallback is not implemented.

The visual guard is a unit test, not a screenshot. It reads the painted font shorthand and the list value, fraction, and gap out of the document, and it checks the hero sizes against the Chrome 156 numbers from `02-list_alt-no-donut.html` (tolerance half a pixel, the same rounding the player hero already uses). A pixel compare needs Chromium in CI, which this pull request does not install.

## Verification

`vp run verify:api|studio|web|ui` is not applicable (no user-reachable route; slide-generator has no verify target). Run format-check, lint, guards, pr-body, typecheck, test, and build.

## Architect

Yes. New renderer, and the template is the first behaviour in `libs/slide-generator`.

## Seams

- `footballTemplate(slide, options)` — one player or list slide in, one document out. Catches size, hero size, list zoom, text passes, colourway, and the missing cover. It does not catch a pixel match against the reference PNG. That waits for the PNG item.

## Comments

Player slice: https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/13

List slice: https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/16
