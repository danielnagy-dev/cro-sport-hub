# ADR-002: Drizzle instead of Prisma

## Status

Accepted

## Context

Plan item 4 needs an ORM and the first Postgres migration: Sport (tennis and football), Competition, Team, Athlete, AthleteTeam, and User. `apps/api` already talks to Postgres 18 with `pg`. Field shapes for those entities, except the user row, already live in `libs/shared-types` as Zod schemas. `teamSchema` says the football-clubs-only rule needs the sport row, which that package does not load. Studio and web do not import the API. Version 1 has two sports, no national teams, and no club pages.

`apps/api` is ESM and pins TypeScript 6 so the Nest CLI can load the compiler (ADR-001). `allowBuilds` is an explicit list.

## Decision

Use Drizzle ORM 0.45 (`drizzle-orm`) in `apps/api`. Docs: https://orm.drizzle.team/llms.txt

Prisma is rejected. The current client (`@prisma/client` 7.10) needs a schema DSL, `prisma generate`, and a driver adapter before `nest build`. That is a second compile step beside the TypeScript split in ADR-001, and a second set of row types beside the Zod schemas. Prisma's engine install scripts would also extend `allowBuilds`. Drizzle's schema is TypeScript compiled by the existing Nest build, and it uses the `pg` driver the health check already uses. It has no install script.

The module interface is `openCatalog`, `write`, and `read`, exported from `apps/api/src/catalog/catalog.ts`. A batch writer that returns a full snapshot was rejected: the only caller is a test that writes one record and reads it back. A filterable catalogue (actors, pages, extension kinds) was rejected: that interface is as large as the tables, and nothing in this change queries it.

`apps/api` owns these types. Studio, web, and `libs/ui` do not import them. `libs/shared-types` keeps the Zod entities. The user row (`id`, `role`) stays in `apps/api` until authentication shares it. `roleSchema` is reused.

Two adapters sit on `openCatalog`: PGLite in the tests (`@electric-sql/pglite`, devDependency), and `pg` in `openPostgresCatalog`. The Nest process does not open the catalog on boot.

Checks and foreign keys live in `apps/api/src/catalog/0001_v1_catalog.sql`. `schema.ts` is the column map Drizzle inserts and selects. `drizzle-kit` is not added; one hand-written migration does not need a second generator. The script is safe to run again (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

The migration seeds `sport-tennis` / Tennis and `sport-football` / Football. Callers do not insert sports. A team is a football club (`sport_slug` is `football`; no national-team column, no page body). A club spell stores `from` and an optional `to` for a football athlete. A user role is `editor` or `admin`. There is no password column.

## Consequences

Callers parse through the shared Zod schemas, then `write` / `read`. The football-club rule and the football-only club spell are enforced here, not in `libs/shared-types`. A later route that returns these records maps them at the controller and adds any new shared schema in that change. Revisit Prisma only if Drizzle cannot express a later migration on Postgres 18.
