# ADR-008: Studio routes are per-feature files

## Status

Accepted

## Context

Studio screens are lazy-loaded from `apps/studio/src/app/app.routes.ts`. Every studio ticket appended a route object to that file, so parallel pull requests conflicted on the same lines. `apps/studio` is built by the Angular CLI (ADR-001), so a filesystem glob is not available. ADR-007 already did this for API modules. This decision touches `apps/studio` only.

Issues #68–#74 add football edit, review, an editor flow, competitions and teams admin, an import log, and gallery review. Several of those can run together. They need to add routes without rewriting one shared table.

## Decision

`app.routes.ts` is the shell. It lazy-loads one `feature/<name>/<name>.routes.ts` per feature with `loadChildren`, lists those entries in folder order, and keeps the `**` redirect. Paths, guards, and `loadComponent` live in the feature file. A new feature adds that file and one shell entry.

Do not add an empty routes file for a screen that has no paths yet. #68 adds a path to `football-form.routes.ts`. #74 adds paths to `gallery.routes.ts`. A new screen, such as review or competitions admin, adds its own folder when the screen exists.

Rejected: leaving the route object in the shell (that is the file every ticket edits), empty route files for #68–#74 (dead code, and the shell would gain a line before the screen exists), and `merge=union` (ADR-007; a union merge does not parse a TypeScript array).

## Consequences

Two features whose shell entries are not adjacent can merge. Two entries inserted on the same line cannot. The shell stays a shared file with one line per feature. Client methods are still `apps/studio/src/app/core/studio-api.ts`. Import direction is unchanged (`.cursor/skills/architect/SKILL.md`, **Studio app**).
