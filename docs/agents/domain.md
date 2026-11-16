# Domain docs

How skills should read domain documentation in this repo. This file wins over the defaults shipped with `domain-modeling`.

## ADRs

ADRs live in `docs/adr/`. Copy `docs/adr/template.md`. Number them `NNN-short-title.md` (for example `001-short-title.md`). Sections are Status, Context, Decision, and Consequences. Status starts as Proposed and becomes Accepted in the pull request that adopts the decision.

Do not number files `0001-slug.md`. Do not use a one-paragraph ADR.

## Glossary

Canonical domain terms live in [`GLOSSARY.md`](../../GLOSSARY.md) at the repository root. Agents and skills should use its English identifiers in code and docs and its Croatian column when matching slide or design copy.

## Words

Use terms from `GLOSSARY.md` first, then existing `docs/` and code. Do not introduce synonyms listed in the glossary’s “Synonyms to avoid” table.
