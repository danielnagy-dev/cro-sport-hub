# ADR-012: Shared schema rules recovered from comments

## Status

Accepted

## Context

Issue #326 removes code comments. The rules below were written only on the Zod schemas in `libs/shared-types`. The code still enforces them. This ADR records why. Packages: `libs/shared-types`, and the API and Studio callers that match these shapes.

## Decision

Ids are 1–64 characters. A UUID fits, and so does a short seed id such as `player-one`.

A country code is an ISO 3166-1 alpha-2 shape. This package does not check the full country list.

Calendar dates run from 1950 through 2100. Timestamps are UTC or an explicit offset, with seconds.

A season is `2026` or `2026/27`. The two-digit year is the next year. `1999/00` is the cross-century case.

A football match is two different clubs. A draw is a valid score. There is no winner column. The team schema does not load the sport row, so the football-only rule is enforced by the caller. Editor club lookup is football only. Tennis has no clubs. v1 has no team page. National teams are a separate entity (ADR-010), not fields on this club object. An older comment said v1 does not track national teams. That sentence is stale.

`yellowCards` is a count from 0 to 2 and `redCard` is a flag. The shared `CardType` enum is display vocabulary. It is not a column. Two yellows require the red-card flag, because a second yellow is a sending-off. The fields stay separate. Minutes stop at 130, which covers extra time and stoppage. Zero minutes means the player did not play, so they cannot have started or recorded a goal or an assist. A booking or a sending-off from the bench is still allowed.

Tennis sets are stored from player A's side: `[gamesA, gamesB]` or `[gamesA, gamesB, tiebreakPointsLost]`. The third number is only present on a 7-6 set. It is the loser's tiebreak total. The winner's total is not stored. A 7-point tiebreak and a 10-point final-set tiebreak both end 7-6 in games, so one number covers both. v1 accepts standard sets only: 6-0 through 6-4, 7-5, or 7-6 with a tiebreak. Match tiebreaks (for example 10-8) and advantage final sets are out of scope. `bestOf` is required here even though an older field list omitted it: a 2-0 score is a finished best of 3, a 3-0 score is a finished best of 5, and a 2-1 score is not finished in a best of 5.

Tennis stats store raw counts. Percentages are not fields. `tennisPercentages` computes them on a 0–100 scale and does not round. `null` means the denominator was 0, which is not 0%. First-serve points won uses first serves in as the denominator. Second-serve points won uses every second-serve point, including double faults. Break points converted uses break points played, not break points faced.

`secondServeTotal` is the first serves that missed. Points won on the second serve cannot exceed the second serves that landed in (`secondServeTotal - doubleFaults`). Aces cannot exceed first-serve points won plus second-serve points won. `secondServePointsWon` is non-negative, so the landed-in check also implies `doubleFaults <= secondServeTotal`. That second check is not repeated.

The public match list handler defaults `limit` to 20 and `offset` to 0. The schema allows a limit from 1 to 50 and does not default it.

## Consequences

Schema changes that break one of these rules need an update here in the same pull request. Display code treats a null tennis percentage as "no attempts", not as 0%.
