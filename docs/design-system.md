# Hrvatski sport / cro-sport-hub — design system

> **Status: approved by Daniel 2026-11-03** (Europe/Zagreb).  
> Still open: **hero cell size** only.  
> Implementation reference for cro-sport-hub (plan #28 slide-generator / [ADR-003](./adr/003-slide-renderer.md) football template).  
> Every factual claim is tagged **Verified** (with source) or **Estimate**.

---

## Not yet implemented in code

Target values below are approved; [`libs/slide-generator/src/football.ts`](../libs/slide-generator/src/football.ts) (round-13 interim template) still differs. This documentation PR does not change the generator.

| Target (approved 2026-11-03)                                                            | Current in `football.ts`                                                                 |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| List passes fraction: **Archivo 700, 24px**, colour `dim`                               | `.kv .frac` is **12px** Archivo 700                                                      |
| List passes **`donut_list` default false**, opt in for donut                            | No list donut API; passes are **text only** (matches default behaviour, no opt-in donut) |
| Red **`mute` α 0.55**; light **`mute` α 0.64**, **`fnc` α 0.64**, **`statmark` α 0.50** | Red/light **`mute` α 0.5**, all colourways **`fnc` α 0.6**, **`statmark` α 0.42**        |

The vendored handoff under `libs/slide-generator/design/football-r13/` may also lag these tokens until a follow-up implementation PR.

---

## 1. Status

|                    |                                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status             | **Approved by Daniel 2026-11-03.** Hero cell size remains open.                                                                                                                                                                             |
| Locked base        | **v1 layout** = round 9 (2026-10-20). **Verified:** external design history (`DIZAJN_VODIC.md` in the design archive).                                                                                                                      |
| Current reference  | Round 13 + **2026-11-03 fixes**: list text passes (no list donut by default), list fraction ≈24px Archivo 700 `dim`, stronger `mute` / `fnc` / `statmark` on red/light for WCAG. **Verified:** Daniel 2026-11-03; handoff generator source. |
| Canonical list PNG | Handoff `png/02-list.png` (text passes). Optional donut: `02-list_alt-donut.png` (when implemented).                                                                                                                                        |
| Generator default  | `donut_list: false`. Opt in with `--donut-list on` / `"donut_list": true` in the handoff generator. **Verified:** handoff `OPTS`.                                                                                                           |

---

## 2. Scope

| In scope now                                                                                                                                                    | Out of scope / future                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Instagram (and similar) **football results carousel**, **1080 × 1350 px (4:5)**, style **R1**, default colourway **navy**. **Verified:** handoff `tokens.json`. | Full web / studio UI theming. **Estimate:** these tokens seed later themes; no web breakpoints yet.                   |
| Slide types: **player**, **list**.                                                                                                                              | Cover / naslovnica — none (Daniel 2026-10-19: stats-only). **Verified:** product decisions doc in the design archive. |
| Colourways navy / red / light (navy = reference).                                                                                                               | —                                                                                                                     |
| Brand wordmark as CSS checker + “HRVATSKI SPORT”.                                                                                                               | Player photos / club logos without rights.                                                                            |

Audience: Croatian-language sports audience; cro-sport-hub engineers. Platform today: HTML/CSS + Playwright → PNG. **Verified:** handoff README in-repo at `libs/slide-generator/design/football-r13/README.md`.

---

## 3. Colour

### 3.1 Colourways (base hex)

**Verified:** handoff `tokens.json` / `COLORWAYS` in the handoff generator.

| Token   | Role                                       | navy           | red            | light          |
| ------- | ------------------------------------------ | -------------- | -------------- | -------------- |
| `bg`    | Background top (0–35%)                     | `#0E1431`      | `#43122A`      | `#F4EEE1`      |
| `bg2`   | Background bottom (100%)                   | `#0A0F25`      | `#120E20`      | `#EEE5D2`      |
| `fg`    | Primary text                               | `#F3EEE3`      | `#F6F0E4`      | `#0E1A3A`      |
| `red`   | Brand accent                               | `#E5263A`      | `#F03A4E`      | `#D0192E`      |
| `rt`    | Legacy red text (unused on current slides) | `#F2475A`      | `#FF9AA5`      | `#D0192E`      |
| `win`   | Score — player’s team won                  | `#5BC490`      | `#74D6A4`      | `#177548`      |
| `loss`  | Score — player’s team lost (draw = `fg`)   | `#F2475A`      | `#FF8C99`      | `#C8192D`      |
| `hrw`   | White squares of brand checker             | `#FFFFFF`      | `#FFFFFF`      | `#FFFFFF`      |
| `field` | Top-700px field texture                    | `#4A63C8` ≤30% | `#E0293F` ≤50% | `#D0192E` ≤18% |

### 3.2 Opacity-derived tokens (per colourway)

Applied as `rgba(fg, α)` over `bg`. **Verified:** `theme_vars()` + `COLORWAYS` keys `mute_a` / `fnc_a` / `statmark_a` / `rule_a` (2026-11-03).

| Token      | navy α |    red α |  light α | Role                                                  |
| ---------- | -----: | -------: | -------: | ----------------------------------------------------- |
| `dim`      |   0.70 |     0.70 |     0.70 | Identity, stat labels, passes fraction, shots bracket |
| `fnc`      |   0.60 |     0.60 | **0.64** | First name                                            |
| `mute`     |   0.50 | **0.55** | **0.64** | Opponent, “vs”, identity separators                   |
| `statmark` |   0.42 |     0.42 | **0.50** | Label marker square                                   |
| `rule`     |   0.16 |     0.16 |     0.22 | Inner hairlines                                       |
| `rule2`    |   0.30 |     0.30 |     0.30 | Heading hairline                                      |
| `texture`  |   0.02 |     0.02 |    0.028 | Micro-checker                                         |

Solid equivalents of mute (for engineers who need hex): navy `#80818A` · red `#A58C90` · light `#616676`. **Verified:** blend script 2026-11-03.

### 3.3 Semantic tokens

| Token                  | Meaning                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `win` / `loss`         | Match outcome from the player’s club; score text only (no pill). Draw = `fg`.             |
| `red`                  | Brand accent, not “danger”. Card icons use fixed `#F2C230` / `#E5263A` fills in SVG only. |
| `dim` / `mute` / `fnc` | Hierarchy by opacity (and size), not by hue.                                              |

Default production colourway: **navy**.

---

## 4. Typography

### 4.1 Families

| Role    | Family                      | Weights used  | Licence                                      |
| ------- | --------------------------- | ------------- | -------------------------------------------- |
| Display | **Big Shoulders Display**   | 700, 800, 900 | SIL OFL 1.1 (bundled under handoff `fonts/`) |
| Text    | **Archivo** @ **88%** width | 500, 700      | SIL OFL 1.1 (bundled under handoff `fonts/`) |

**Verified:** handoff fonts + licences. Diacritics čćžšđ; cap-accent surnames get extra top gap.

### 4.2 Size scale (selected)

**Verified:** handoff tokens / CSS / measured HTML 2026-11-03.

| Element                            | Size / notes                                          | Colour |
| ---------------------------------- | ----------------------------------------------------- | ------ |
| Player surname                     | BS 900, 192px (auto-fit)                              | `fg`   |
| Player first name                  | BS 700, 0.58× surname                                 | `fnc`  |
| List surname                       | BS 800, 56px                                          | `fg`   |
| List first name                    | BS 700, 0.5× (28px)                                   | `fnc`  |
| List passes **%** (default)        | BS 800, **34px**                                      | `fg`   |
| List passes **fraction** (default) | Archivo 700, **24px** before list zoom (`dim`)        | `dim`  |
| List stat value                    | BS 800, 34px                                          | `fg`   |
| List stat label                    | Archivo 700, 12px                                     | `dim`  |
| Player passes                      | fraction under label + **donut** with % (player only) | —      |
| Hero value                         | browser-measured — **OPEN**                           | `fg`   |

Full per-element table: handoff `TOKENS.md` at `libs/slide-generator/design/football-r13/TOKENS.md`.

---

## 5. Spacing, grid, radius

| Property           | Value                                                           | Claim                 |
| ------------------ | --------------------------------------------------------------- | --------------------- |
| Artboard           | 1080 × 1350, PNG 1×                                             | **Verified**          |
| Safe margin        | **72 px**                                                       | **Verified**          |
| Content bottom     | 184 px (footer zone)                                            | **Verified**          |
| List zoom          | 4 rows 1.15 · 3 rows 1.3 · ≤2 rows 1.5                          | **Verified** `FIT_JS` |
| List cell          | 104 px (hero 128); text passes = 1 col; donut-on = 2 cols (208) | **Verified**          |
| Player + hero grid | Hero `1.3fr` spanning **2 rows**                                | **Verified**          |
| Player balanced    | 4→2+2 … 8→4+4                                                   | **Verified** (v1)     |
| **Radius**         | **0 px**                                                        | **Verified**          |

---

## 6. Core components

- **Player slide** — meta → name → identity → match → stats (optional hero) → wordmark. PNG: `png/01-player.png`.
- **List slide** — league heading + rows (name / identity / match \| stats). PNG: `png/02-list.png`.
- **Name block** — muted smaller first name above surname (`fnc`).
- **Identity** — `CLUB · #NO · POSITION` in `dim`.
- **Match line** — `[score] vs [icon] OPPONENT`; score `win`/`loss`/`fg`; no pill.
- **Stat cell** — label + value; hairlines; `statmark` square.
- **Hero cell** — 2 rows tall; auto goals→assists→saves→rating; never minutes/cards. **Size still open.**
- **Shots** — `5 (3)` (total + on-target bracket).
- **Passes**
  - **Player:** donut on the right + `25/32` under label. **Verified** round 12–13.
  - **List (default):** text **`84%`** + **`38/45`** below (Archivo 700, 24px, `dim`). **No donut.** **Verified:** Daniel 2026-10-29 + size 2026-11-03.
- **Icons** — 24px grid, stroke 1.75, project-drawn (handoff `src/icons/`).
- **Wordmark** — 40×40 checker + “HRVATSKI SPORT” BS 800 32px.

---

## Further sections

Content rules, accessibility tables, open questions (including **hero cell size**), Figma note, repo file map, change log, and appendix A live in [design-system/supplement.md](./design-system/supplement.md).
