# ADR-015: Public pages render on each request

## Status

Accepted

## Context

Issue #326 removes code comments. The same note was copied onto every public page in `apps/web`. Packages: `apps/web`.

## Decision

The home page, the sport pages, the athlete page, and the sitemap set `dynamic = 'force-dynamic'`. A down API must not be baked into the build, and athlete slugs must stay current when the API is up.

The server calls the API at the local origin. The browser does not.

## Consequences

A public page that should survive a down API at request time keeps `force-dynamic`. Do not switch these routes to static rendering to speed up the build.
