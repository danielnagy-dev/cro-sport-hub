# ADR-016: Match-card tiebreak text

## Status

Accepted

## Context

Issue #326 removes code comments. This choice was written only on the tennis score cell in `libs/ui`. Packages: `libs/ui`.

## Decision

The third number in a set is the loser's tiebreak total (ADR-012). The score cell reads that total with the player in a visually hidden phrase. The superscript is `aria-hidden` so assistive tech does not announce the number twice.

`winner` is omitted when a retirement has no winner yet.

A null tennis percentage is a zero denominator, not 0% (ADR-012).

## Consequences

A score change keeps the hidden phrase and the hidden superscript together. Do not announce the superscript on its own.
