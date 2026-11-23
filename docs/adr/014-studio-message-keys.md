# ADR-014: Studio message keys recovered from comments

## Status

Accepted

## Context

Issue #326 removes code comments. These choices were written only in `apps/studio`. Packages: `apps/studio`. Studio still does not import React from `libs/ui` (ADR-010).

## Decision

Message keys are `<surface>.<role>` with kebab segments (`nav.pocetna`, `chrome.log-out`, `sportasi.lead`). Surfaces are `nav`, `chrome`, empty-screen ids, `objave`, `postavke`, `publish-drawer`, and `shell-home`. The ids stay stable so a later locale file can use the same keys.

`resolveMessage` throws when a key is missing. There is no silent fallback. `t` reads the default HR map.

Studio does not depend on `zod`. Field messages read the `flatten()` shape. `listForAthlete` asks for direct athlete rows and for national-team appearances where the athlete is in the lineup.

## Consequences

A new string adds a key and an HR value in the same change. Do not rename a key without updating every locale file. Do not add a `zod` dependency to Studio to parse those field errors.
