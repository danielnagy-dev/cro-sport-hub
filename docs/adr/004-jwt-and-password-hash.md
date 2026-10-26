# ADR-004: JWT login with bcryptjs

## Status

Accepted

## Context

Plan item 10 adds login for the seeded catalog users `editor-demo` and `admin-demo`. ADR-002 stored those rows as `id` and `role` and left passwords out. Studio login is still a later plan. The API is ESM, TypeScript 6, and `allowBuilds` is an explicit list (ADR-001). The migration runner splits each SQL file on semicolons, so a credential change has to be a single `IF NOT EXISTS` statement.

## Decision

Login lives in `apps/api`. Studio, web, and `libs/shared-types` do not import it. The public user row stays `{ id, role }`. `password_hash` is a nullable text column added by `0005_v1_credentials.sql`. Catalog `read` does not select it.

Hash with `bcryptjs` (bcrypt, cost 10, pure JavaScript). Sign tokens with `jose` (HS256, 12 hour expiry, claims `sub` and `role`). The signing key is `JWT_SECRET` (at least 32 characters). Demo passwords are `EDITOR_DEMO_PASSWORD` and `ADMIN_DEMO_PASSWORD` (8 to 72 characters, bcrypt's own limit). Both are read from the environment. `.env.example` holds placeholders.

The interface is `login(store, secret, { id, password })` returning `{ token }`, plus `EditorGuard` (editor and admin) and `AdminGuard` (admin only). The guards are not registered globally. `GET /api/matches` stays public.

Rejected: native `bcrypt` and `argon2`, because they need install scripts and a new `allowBuilds` entry. Rejected: a hand-rolled HMAC token. Rejected: `@nestjs/jwt` with Passport and `passport-jwt`, a second stack for one route. Rejected: a shared user schema that includes the hash. Nothing outside the API verifies a password yet.

## Consequences

`vp run api#seed` hashes the two demo passwords after the catalog rows are written. A missing or short variable fails that command and does not print the value. Login returns 401 for an unknown user, a wrong password, and a null hash, with one message. A missing `JWT_SECRET` fails the login request, not process boot, so `/health` and `GET /api/matches` still start. Callers send `Authorization: Bearer <token>`. Revisit a shared login schema when studio calls this route.
