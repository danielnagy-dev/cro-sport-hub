# 19b: Tennis results on the athlete page

**What to build:** A tennis athlete page renders each published result with `MatchCard` and `TennisStats`. Percentages come from the counts through that component. This note is the spec.

**Blocked by:** 19a (`.scratch/web/issues/19a-athlete-profile.md`) and 8b (`.scratch/athletes/issues/8b-tennis-results.md`).

**Status:** ready-for-agent

**Size:** 240 counted lines. One section component on the 19a page. `MatchCard` and `TennisStats` already exist (plan 16).

## Scope

In: when the profile sport is tennis and `results` is present, render each result. `MatchCard` shows the two names, the sets, the winner, and retirement. `TennisStats` shows the percentages, including `No attempts` when a percentage is null. The opponent name and the athlete name are the two card names. No raw percentage is typed into the page. A football profile renders no tennis section.

Out: appearances (19c) and any new UI component. Extend `web.athlete` in `docs/feature-map.md`.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] Sample Player A's page shows the final, Sample Player B, Winner, and the 7-6 tiebreak on the loser. The quarterfinal is absent.
- [ ] The stats table shows 60% for the first serve. A null percentage renders `No attempts`, not `0%`.
- [ ] Karlo Brkić's page shows no tennis scoreboard.

## Verification

Unit test with the 8b fixture. `vp run verify:web --route /athletes/sample-player-a` proves the route still returns 200. Live stats need the API.

## Architect

No. `TennisStats` already calls `tennisPercentages`. The page passes the counts from 8b.

### Seams

- The tennis section with a stubbed 8b body. Catches a draft on the page, a `0%` where the value was null, and a tennis board on a football profile.
