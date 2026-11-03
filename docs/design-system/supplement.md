# Design system supplement

Continuation of [design-system.md](../design-system.md): content rules, accessibility, open questions, Figma, change log, and appendix.

---

## 7. Content rules (pointer)

Owned by editorial workflow, not this design system. Design consumes desk JSON; it does not invent facts.

- Stats-only slides; narrative in the post caption (Daniel 2026-10-19). **Verified:** product decisions in the design archive.
- No third-party ratings in public posts; own “ocjena +385” not approved to publish yet.
- Position = full Croatian text from the editor. **Verified:** design guide in the archive.
- Fact-check → review chain → Daniel before publish.

---

## 8. Accessibility

Targets: **≥ 3:1** large text; **≥ 4.5:1** body. Ratios **computed 2026-11-03** (WCAG 2.1 relative luminance) with alpha tokens composited onto each colourway `bg`. **Verified** (contrast script, 2026-11-03 session).

### 8.1 Contrast after 2026-11-03 opacity fixes

| Colourway | Pair             |        α |       Ratio | ≥3:1 |          ≥4.5:1          |
| --------- | ---------------- | -------: | ----------: | :--: | :----------------------: |
| navy      | `fg`             |        1 |   **15.61** |  Y   |            Y             |
| navy      | `dim`            |     0.70 |    **8.05** |  Y   |            Y             |
| navy      | `fnc`            |     0.60 |    **6.20** |  Y   |            Y             |
| navy      | `mute`           |     0.50 |    **4.67** |  Y   |            Y             |
| navy      | `statmark`       |     0.42 |    **3.66** |  Y   |        N (marker)        |
| navy      | `win` / `loss`   |        1 | 8.38 / 5.01 |  Y   |            Y             |
| red       | `mute`           | **0.55** |    **4.98** |  Y   |            Y             |
| red       | `fnc`            |     0.60 |    **5.68** |  Y   |            Y             |
| red       | `statmark`       |     0.42 |    **3.47** |  Y   |        N (marker)        |
| light     | `mute`           | **0.64** |    **4.93** |  Y   |            Y             |
| light     | `fnc`            | **0.64** |    **4.93** |  Y   |            Y             |
| light     | `statmark`       | **0.50** |    **3.23** |  Y   |        N (marker)        |
| all       | `rule` / `rule2` |        — |          <3 |  N   | N (decorative hairlines) |

`fnc` is used for first names (large text). It was raised on light anyway so it also clears 4.5:1. List match-line opponent uses `mute` at 20px Archivo 500 → body criterion; red/light now pass with margin (≥4.6 target).

### 8.2 Mobile / media

- 72px safe zone; `CHECK_JS` flags overflow.
- Prefer list text passes (default) for phone legibility.
- Alt text in **Croatian** for public images. **Estimate** (audience pattern).
- **No player photos / club logos** without rights. **Verified:** handoff README.

---

## 9. Open questions

1. **Hero cell size** (player example ~278px vs 192px surname; list ~2.5× name cap). Awaiting Daniel.
2. Browser-measured layout (fit / hero / list zoom) must be ported for any server-side renderer.
3. Optional: full visual re-review of red/light after rounds 10–13 (contrast blockers for mute/fnc/statmark are closed).

**Resolved 2026-11-03:** list passes = text by default; fraction 24px Archivo 700 `dim`; `donut_list` default false; mute/fnc/statmark opacities for WCAG on red/light.

---

## 10. Figma state

https://www.figma.com/design/QSx1Oui3xatiraaBMIRbDY — private, **out of date** (pre–fast-loop). Source of truth: handoff PNGs/HTML + the design system docs. **Verified:** design guide in the archive. Figma not called for this update.

---

## 11. File map (this repo)

| Path                                        | Role                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `docs/design-system.md`                     | Approved design system (core tokens and layout)                                |
| `docs/design-system/supplement.md`          | Content rules, a11y, open questions, changelog (this file)                     |
| `libs/slide-generator/design/football-r13/` | Vendored handoff (tokens, PNG, HTML, fonts)                                    |
| `libs/slide-generator/src/football.ts`      | Round-13 interim TypeScript template ([ADR-003](../adr/003-slide-renderer.md)) |
| `docs/adr/003-slide-renderer.md`            | Renderer decision (Chromium HTML → PNG)                                        |

External design archive paths (not in git): frozen v1, design history, and project-hub product notes referenced during handoff.

---

## 12. Change log

| Date (Europe/Zagreb) | Change                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-20           | v1 layout locked (round 9).                                                                                                                                                                                                                                                                                                                              |
| 2026-10-20 → 10-28   | Rounds 10–13: hero, shots `5 (3)`, passes+donut, muted first name.                                                                                                                                                                                                                                                                                       |
| 2026-10-25           | Design handoff folder for cro-sport-hub #28.                                                                                                                                                                                                                                                                                                             |
| 2026-10-29           | Daniel: list passes text-only (decision recorded).                                                                                                                                                                                                                                                                                                       |
| 2026-11-03           | Draft design system written; contrast audit; critique fixed list fraction docs.                                                                                                                                                                                                                                                                          |
| **2026-11-03**       | **Daniel approved three fixes.** Applied in handoff: list fraction **24px** Archivo 700 `dim`; `donut_list` **default false**; mute α red **0.55** / light **0.64**, light fnc **0.64**, light statmark **0.50**. Re-rendered PNGs; `02-list.png` = text; `02-list_alt-donut.png` = optional donut. Document set to **Approved** (hero size still open). |
| **2026-11-03**       | Added to cro-sport-hub under `docs/design-system/`.                                                                                                                                                                                                                                                                                                      |

---

## Appendix A — Design critique re-check (list slide, 2026-11-03)

**Asset.** `png/02-list.png` (navy, text passes, post-fix).  
**Verdict.** No blockers; approved fixes render cleanly (24px fraction, no donut, no overflow, 0 elements outside safe zone).

| Finding | Severity | Fix                                                         |
| ------- | -------- | ----------------------------------------------------------- |
| —       | —        | No blocker or worth-fixing issues on the updated list slide |

Measured: passes cells `b.pt`, fraction 24px Archivo 700, no ring; cell overflow none; `CHECK_JS` clear.
