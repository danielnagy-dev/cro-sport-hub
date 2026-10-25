# Hrvatski sport – football results carousel: design handoff

> **STATUS: ROUND 13, PENDING DANIEL'S FINAL APPROVAL.**
> This snapshot is the latest iteration, but it is **not final**. Two questions are still open (see [Open questions](#open-questions-round-13)). Don't treat sizes marked "open" as locked.
> The last design Daniel locked is **v1** (round 9). Rounds 10–13 added the hero stat, merged shots, passes with donut, and the muted first name.

For: **cro-sport-hub**, plan #28 (slide-generator, ADR-003, football template).
Format: Instagram carousel, **1080 × 1350 px (4:5)**, style "R1", reference colourway **navy**.

All PNGs and the sample JSON use **EXAMPLE DATA**: fictional player names and invented numbers (stats, shirt numbers, positions, passes). Club and league names appear only as plain text. There are no player photos, no club logos and no personal data.

---

## Slide types

The round-13 generator has exactly **two slide types**: `player` and `list`. There is **no cover/naslovnica slide** in this design (see [Gaps](#gaps)).

| # | Type | PNG | What it is |
|---|---|---|---|
| 01 | `player` | `png/01-player.png` | One player's match. Meta heading, a big two-line name, an identity line, a match line, and a stats grid with an optional hero stat. Up to 8 stats. |
| 02 | `list` | `png/02-list.png` | One league, up to 4 players (soft limit; hard limit 6). Each row has the name, identity and match line on the left and a compact stats grid on the right. Passes are shown with a mini donut (current default). |
| 02-alt | `list` (no list donut) | `png/02-list_alt-no-donut.png` | Same list slide with `--donut-list off`, so passes read as **84%** with **38/45** below. This is the alternative for the open question. |
| – | colourways | `png/colourways/01-player_{red,light}.png`, `png/colourways/02-list_{red,light}.png` | Secondary colourways from the same source. These were last reviewed at v1; round 10–13 elements haven't had a dedicated red/light review. |

Both slide types share a frame: background gradient, a checkerboard "field" texture in the top 700 px, a micro-texture, and the brand footer at bottom-left (red/white checker mark + "HRVATSKI SPORT" wordmark, drawn in CSS, not an image). An optional `n / total` counter and swipe hint exist but are off by default.

## Layout rules

**Global**
- Safe zone is 72 px on every side. The content box is 72/72/72 px with 184 px at the bottom, because the brand footer sits at 72/72. The renderer flags anything outside this zone (`CHECK_JS`).
- Every slide starts with a meta heading: `COMPETITION ▪ ROUND ▪ DATE` (Archivo 700, 20 px, uppercase, red 8 px squares, hairline below). On the list slide this is the league heading, and it is not scaled by the list zoom.
- Hierarchy is set **by size, not colour**: name > identity line > match line. Player slide: identity 28 px > match 25 px. List: identity 22 px > match 20 px.
- **First name is smaller and muted** compared with the surname, and sits above it. Player: 0.58 × surname, weight 700, colour `fnc` (fg 60%); surname 192 px, weight 900. List: first name 0.5 × surname, `fnc`, stacked above the surname (56 px, weight 800). A surname with a capital accent (Č Ć Š Ž Đ) gets extra space above so the caron never touches the first name.
- Long names shrink to fit. The identity and match lines truncate with an ellipsis; the opponent name is cut first.
- The identity line is `club · #number · position`, all in `dim` (70%) with no club emphasis and 6 px `mute` separators. It sits below the name on the player slide and above the name on the list (in split layout it comes after the name in the left column).
- The match line is `[score] vs [home/away icon] OPPONENT`. The score is home–away and coloured by the player's team outcome: `win` green, `loss` red, draw `fg`. There is no pill or background behind it. The opponent is weight 500 in `mute`, and "vs" is smaller and quieter. On the list, score, icon and opponent share one cap height (measured in the browser). On the player slide, the score is 1.45 × that cap height.
- Stats form an editorial grid: no cell backgrounds and no outer frame, only 1 px inner dividers (`rule`). The first column has no left padding and lines up with the content edge. Each label (uppercase, `dim`) sits above its value and has a neutral 6 px `statmark` square, not red.
- Radii are 0 everywhere.

**Player slide grid (v1 "balanced")**
- Without a hero, 1–3 stats go in one row. Larger counts split as 4 → 2+2, 5 → 3+2, 6 → 3+3, 7 → 4+3, 8 → 4+4. Value size depends on the count (168/136/112/96/88 px).
- **Hero stat**: one significant stat gets a cell 1.3fr wide that spans **two rows** in the v1 grid. The other stats fill 2 rows on the right (hero + 3×2 in the example).
  - Auto pick: goals > 0, then assists > 0, then saves > 0, then rating. Minutes and cards are never picked automatically.
  - A player-level `"hero": "<key>"` overrides the pick, and `"none"` disables it. The hero needs at least 2 stats.
  - The hero value is sized in the browser to run from the cap top of the first-row values to the baseline of the second-row values (278 px in the example). The label sits directly above it. *(Size is an open question.)*
- **Shots** are one cell, `Udarci (u okvir)`, shown as **`5 (3)`**: total shots, then shots on target in brackets at 0.56× size in `dim`. Input is `{"key":"shots","value":"5","on_target":"3"}`. An older separate `sot` stat is merged automatically.
- **Passes** input is `{"key":"passes","accurate":25,"total":32}`. The percentage is computed (78%). The cell shows the label, then `25/32` directly below (BS 800, 0.36×, `dim`). On the right, vertically centred, is a **donut ring** with the % inside: ring 0.8× the value size, stroke 9/100, track at 15%, arc in `fg` starting at 12 o'clock and running clockwise.

**List slide**
- Rows are split: the left column holds the first name, surname, identity and match line. On the right is a stats grid of fixed **104 px** columns, up to 4 columns × 2 rows. The column count is the largest any row on the slide needs, so columns line up from row to row. Cells are left-aligned and minutes goes in column 1 (column 2 when the row has a hero).
- The top of the first visible name line (the first name) is aligned to the **cap top of the first stat label**. This is measured per row, so it still holds when a name shrinks.
- The list hero (only for rows with at least 4 stats) uses a fixed 128 px column spanning both rows. It is sized like the player hero. *(Size is an open question.)*
- Passes with the donut take **2 columns (208 px)**: `38/45` (22 px) under the label, and a 64 px ring with a 21 px % on the right. The alternative (`--donut-list off`) is a 1-column cell with `84%` and `38/45` below. *(Open question.)*
- The whole list block is zoomed to fill the slide: 1.15 for 4 rows, 1.3 for 3, 1.5 for 2 or fewer. Spare height is spread evenly into the row padding.

Full values are in `tokens.json` and `TOKENS.md`. The JSON input schema is documented in the docstring at the top of `src/generate_slides.py` (Croatian) and shown by `src/sample/example_data.json`.

## Open questions (round 13)

Daniel hasn't answered these yet:
1. **List slide passes.** Mini donut over 2 columns (`png/02-list.png`, current default) or text `84%` + `38/45` in 1 column (`png/02-list_alt-no-donut.png`)? The designer's view: the list donut slightly disturbs the reading flow, and the text variant is calmer. The player-slide donut isn't in question.
2. **Hero cell size.** On the player slide the hero value is about 278 px, taller than the 192 px surname. On the list it is about 2.5× the surname cap height. Should both stay this size or get smaller?

Until he decides, implement both as switches. The generator already has `donut_list` true/false and `hero_stat` / `hero_list` on/off, and the hero size comes from a single measurement function.

## File map

```
football-slides/
├── README.md                 this file
├── TOKENS.md                 tokens as tables (same content as tokens.json)
├── tokens.json               colours (3 colourways, hex + alpha + role), fonts, type per element, spacing, grid, radii, slide size
├── png/
│   ├── 01-player.png                 player slide, navy (reference)
│   ├── 02-list.png                   list slide, navy, list donut on (current default)
│   ├── 02-list_alt-no-donut.png      list slide, navy, passes as text (open question 1)
│   └── colourways/                   01-player_{red,light}.png, 02-list_{red,light}.png
└── src/
    ├── render.sh             one command: renders all PNGs, standalone HTML and icons, then verifies sizes
    ├── generate_slides.py    the generator (round-13 snapshot of varijante_R/generate_r.py): HTML/CSS + in-browser fit JS + Playwright render
    ├── template/generate.py  shared helpers imported by the generator (player grouping, slide merging)
    ├── export_html.py        makes standalone HTML (relative font paths + inlined fit script)
    ├── export_icons.py       writes icons/*.svg from the generator's icon set
    ├── export_tokens.py      regenerates tokens.json / TOKENS.md from the generator
    ├── verify_png.py         fails unless every PNG is exactly 1080×1350
    ├── sample/example_data.json   EXAMPLE DATA (fictional players, invented numbers)
    ├── html/                 01-player.html, 02-list.html, 02-list_alt-no-donut.html (standalone, pixel-identical to the PNGs)
    ├── icons/                18 stroke icons (24 px grid, 1.75 stroke, currentColor) + donut_ring_78pct.svg
    └── fonts/                BigShouldersDisplay.ttf, Archivo.ttf (variable) + OFL licence texts
```

### Rendering

```bash
pip install playwright pillow          # Python 3.10+; uses an installed Chrome/Chromium
cd src && CHROME=/path/to/chrome PY=python3 ./render.sh
```
`CHROME` defaults to `/usr/bin/google-chrome`. Direct use:
`python3 generate_slides.py sample/example_data.json --style R1 --colorway navy --out OUT --prefix s --no-preview [--donut-list off] [--hero-stat off] [--hero-list off]`.
To open the HTML in a browser, use a 1080×1350 viewport. Chrome needs `--allow-file-access-from-files` for the `file://` fonts, or you can serve `src/` with `python3 -m http.server`. The fit script runs on load. Layout depends on in-browser measurement (name shrink, cap alignment, hero size, list zoom), so a server-side port must keep these measurements or reproduce them.

### Fonts and licences
- **Big Shoulders Display** (variable, weights 100–900; weights 700/800/900 used) for names, numbers, scores and the wordmark. SIL Open Font License 1.1, bundled. See `src/fonts/OFL_BigShoulders.txt`.
- **Archivo** (variable, weights 100–900, width 62–125%; weights 500/700 at 88% width used) for labels, identity, match lines and headings. SIL Open Font License 1.1, bundled. See `src/fonts/OFL_Archivo.txt`.
- Icons are drawn for this project, so no third-party icon licence applies.

## Figma

A Figma file exists: https://www.figma.com/design/QSx1Oui3xatiraaBMIRbDY. It is a private working draft and has not been shared.
**It is out of date.** It reflects the round-U state, from before the fast-loop rounds 2–13 and before v1. A prepared update script (`figma_build/callV_full.js`) was never run, and it is also outdated. Use the PNGs and HTML in this folder as the reference, not Figma.

## Gaps
- **No cover / naslovnica slide.** The round-13 design has only `player` and `list`. No cover was designed in the R1 direction. The earlier "S2 Naslovnica" exploration was an alternative editorial-poster style for the same player and list slides, not a cover type, and it was not continued. If the template needs a cover, it has to be designed first.
- Red and light colourways haven't been re-reviewed since v1. They render correctly, but rounds 10–13 elements (hero, donut, muted first name) were only tuned in navy.
- The **list** slide's hero and passes treatment depend on the open questions above.
- The donut % and hero sizing are computed in the browser. There are no static numbers for the hero size, only the rule plus example values.
