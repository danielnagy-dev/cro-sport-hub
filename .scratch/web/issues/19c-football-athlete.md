# 19c: Football appearances on the athlete page

**What to build:** A football athlete page renders `AppearancesTable` from the 8c results. This note is the spec.

**Blocked by:** 19a (`.scratch/web/issues/19a-athlete-profile.md`) and 8c (`.scratch/athletes/issues/8c-football-appearances.md`).

**Status:** ready-for-agent

**Size:** 220 counted lines. One section that maps 8c results into the `AppearanceLine` shape `AppearancesTable` already takes.

## Scope

In: when the sport is football and `results` is present, render `AppearancesTable` with the athlete name, the competition, the date, the round, and the appearance counts. The club name is visible. Filip Šarić's row shows `Second yellow` (the table already maps two yellows that way). An empty results array shows the table's `No appearances` copy. A tennis profile renders no appearances table. The tennis section from 19b stays.

Out: new columns and any change to `libs/ui`. Extend `web.athlete` in `docs/feature-map.md`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] Karlo Brkić's page shows Sample League, Matchday 8, 90 minutes, and 2 goals.
- [ ] Filip Šarić's page shows `Second yellow`.
- [ ] Sample Player A's page shows no appearances table.
- [ ] A football profile with `results: []` shows `No appearances`.

## Verification

Unit test with the 8c fixture. `vp run verify:web --route /athletes/karlo-brkic` proves the route returns 200.

## Architect

No. `AppearancesTable` is plan 16. The page does not recompute cards.

### Seams

- The football section with a stubbed 8c body. Catches a tennis profile that renders the table, and a two-yellow row that does not say `Second yellow`.
