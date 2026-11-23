# ADR-013: API process edges recovered from comments

## Status

Accepted

## Context

Issue #326 removes code comments. These choices were written only next to the code in `apps/api`. They are not a new design. Packages: `apps/api`.

## Decision

The in-source database URL is the local default and has no password. A real connection sets `DATABASE_URL` in the repository-root `.env`. `loadRootEnv` reads that file from three levels above `src/` and `dist/`, and it leaves variables that are already set.

`POST /api/login` returns 200. Nest's default for POST is 201, so the route sets the code. The credential store and the catalog open for one request. The process does not connect on boot.

Postgres and Redis probes attach an `error` listener. A drop after connect emits `error`, and with no listener Node exits. `client.end()` and Redis `destroy()` can throw when the client never opened. The probe still reports down.

The public-read cache falls back to the catalog when Redis fails or the payload does not match the schema. A failed store write still returns the page or profile the catalog returned.

Migration SQL is split on `;` outside dollar-quoted strings.

Editor club lookup is football only. Tennis has no clubs.

Published match lists with no sport order by `match_date` (`matches_date_sport`). With a sport they filter `sport_id` and `status` (`matches_sport_status_date`).

Catalog seed is fictional sample data. Editorial national teams, appearances, lineups, and publish slots are the demo path. Legacy match catalog tables are not seeded. PGLite suites that still read public matches insert that older sample through `write-sample-matches`.

API Vitest `testTimeout` and `hookTimeout` are 30 seconds. Each suite runs PGLite migrations and seed, which exceeds Vitest's 5 second default on CI.

`openApiConfig` calls `addTag` for the tags that already exist. A new feature sets `@ApiTags` on its controller instead of adding another `addTag` call. An older comment said not to call `addTag` at all. That sentence was already false.

## Consequences

Callers keep using the root `.env` and the per-request catalog. Do not put the Compose password in source. Do not remove the probe `error` listeners. New OpenAPI tags go on the controller.
