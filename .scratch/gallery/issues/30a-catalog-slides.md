# 30a: Catalog fields on football slides

**What to build:** A football slide can be built from a catalog appearance. It shows only fields the catalog stores, stats as text, and one optional caption. The round-13 handoff sample that includes a shirt number still renders that number. This note is the spec.

**Blocked by:** None. The template and `footballSlides` are on main (plan items 28 and 29, ADR-003).

**Status:** claimed

**Size:** 300 counted lines. Optional number, position, and caption on the template, a mapper in a new file, and tests. Persistence is 30b. PNG bytes are 30c.

## Scope

In: `FootballPerson.number` and `position` become optional. `who()` omits the `#n` span when `number` is absent, and omits the position span when `position` is absent. A present number still renders `#${number}`. An optional `caption` on the player slide and the list slide paints one text line when it is a non-empty string, and paints nothing when it is absent or empty.

A new module in `libs/slide-generator` maps catalog appearances to `FootballEntry` values, then the existing `footballSlides` groups them: one appearance in a round is a player slide, two to six are one list, and a seventh starts another list. Stats are text rows only: Goals, Assists, Minutes, and Cards. Cards text is `Second yellow` when `yellowCards` is 2, `Yellow` when it is 1 and `redCard` is false, `Red` when `redCard` is true and `yellowCards` is not 2, and `None` otherwise. The mapper never sets `accurate` or `total` (those paint the ring), and never sets a shirt number, passes, saves, rating, or shots. Hero is `goals` when goals are greater than 0, otherwise `assists` when assists are greater than 0, otherwise `none`. Minutes and cards are never the hero. `lineup` comes from `started`. Names, the club, the score, the round, and the date come from the catalog row. Position is included only when the athlete row has one.

`football.ts` stays at or under 20000 bytes so the file-size guard (bytes/4, limit 5000) still passes. The mapper does not go in that file. If the caption markup does not fit there, insert the caption into the HTML the template already returned, and leave a document with no caption byte-for-byte aside from that. Do not edit `apps/api/src/catalog/catalog.ts`.

Out: saving a gallery, rendering PNG bytes, studio, a public gallery page, and social posting. The handoff donut option stays for callers that pass `accurate` and `total`. No new dependency and no new ADR. ADR-003 already records this consequence. Update `docs/feature-map.md` only if a route changes; this slice has none.

## Order

Plan is this note. Architect sketches the mapper signature below. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [x] A handoff player that still passes `number` renders `#` plus that number, and a document with no caption has no caption line.
- [x] A mapped slide for Karlo Brkić in `match-sample-league` (2 goals, 90 minutes, no cards, position Forward, no shirt number) includes Goals `2`, Minutes `90`, Cards `None`, and Forward, and includes neither a `#` span nor a `ring` class.
- [x] Filip Šarić in that match maps Cards to `Second yellow` and the hero to goals. Bruno Perić maps the hero to `none` and lineup to sub.
- [x] A non-empty caption is one text line. An empty caption adds no line.
- [x] Five appearances in that match are one list slide. `football.ts` is still at or under 20000 bytes.

## Verification

`vp run` the slide-generator test task. `vp run verify:ui` does not render these slides. Say that in the results table.

## Architect

Yes. The template signature grows an optional number, position, and caption. No ADR and no new dependency.

`catalogSlides(appearances)` returns `FootballEntry[]`. Callers pass those to `footballSlides`. The API does not learn a second grouping rule.

### Seams

- `footballTemplate` with and without `number` and `caption`. Catches a `#undefined` and a caption on the handoff sample.
- `catalogSlides` on the seeded league appearances. Catches a ring, a passes stat, or a shirt number in the HTML.

## Comments

- https://github.com/danielnagy-dev/cro-sport-hub/pull/40
