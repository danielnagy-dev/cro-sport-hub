# ADR-009: Studio HTTP clients are per-feature files

## Status

Accepted

## Context

Every studio HTTP call was a method on `apps/studio/src/app/core/studio-api.ts`. Parallel studio tickets appended to that class and conflicted. ADR-008 moved routes into per-feature files. This decision is the client half. It touches `apps/studio` only. Session handling stays in `core/auth.ts`.

Issues #68–#74 add football edit, review, competitions and teams admin, an import log, and gallery review. Several of those add HTTP calls and can run together.

## Decision

A client is `apps/studio/src/app/core/<name>-api.ts`, an `@Injectable({ providedIn: 'root' })` class. The screen injects the client it calls. `core/studio-http.ts` is the shared GET, POST, PUT, PATCH, and blob helper. Do not add an endpoint method to it.

A client lives in `core/` because sibling features cannot import each other. A second screen can inject the same client. A new screen adds `core/<name>-api.ts` and does not edit another feature's client.

Do not add an empty client for a screen that has no call yet. #68 adds football reads and writes on `football-api.ts`. #74 adds gallery review calls on `gallery-api.ts`. Review, competitions, teams, and import add a client file when the screen exists.

Rejected: one `StudioApi` class (the file every ticket edits), empty clients for #69–#73, and a client inside a feature folder when another feature must call it.

## Consequences

Two studio features that add different clients do not share a TypeScript file. The shell route list is still one shared line per feature (ADR-008). No new runtime dependency.
