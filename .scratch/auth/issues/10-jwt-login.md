# 10: JWT login

**What to build:** `POST /api/login` returns a JWT for `editor-demo` and `admin-demo` when the password matches, and 401 otherwise. `EditorGuard` allows editor and admin. `AdminGuard` allows admin only. Tests cover login and both guards.

The seed stored those users as id and role. This adds `password_hash` (`IF NOT EXISTS`, one statement) and hashes `EDITOR_DEMO_PASSWORD` and `ADMIN_DEMO_PASSWORD` during `vp run api#seed`. `JWT_SECRET` signs tokens. Placeholders are in `.env.example`. Tests generate their own values. `GET /api/matches` stays public.

**Blocked by:** Plan item 6, resolved in PR #15.

**Status:** resolved

## Scope

In: login, both guards, the hash column, demo password assignment, ADR-004. Out: studio `/login`, guarding match routes, a global guard, shared-types.

## Order

Architect is ADR-004. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [x] A right password returns a JWT with `sub` and `role`. A wrong password, an unknown id, and a null hash are the same 401.
- [x] The editor guard allows editor and admin. The admin guard allows admin only. Missing, invalid, and expired bearers are rejected.
- [x] `GET /api/matches` stays unauthenticated. The stored hash is not the plaintext.

## Verification

`vp run verify:api` and `vpx tools/verify/verify.ts api --route /api/matches`. The verify CLI only GETs, so login 200 and 401 are the Nest test.

## Architect

Yes. ADR-004. `bcryptjs` hashes passwords (pure JavaScript, no `allowBuilds` change). `jose` signs HS256. Native bcrypt and argon2 need install scripts. Passport plus `@nestjs/jwt` is a second stack for one route.

## Seams

- `login(store, secret, { id, password })`. A compare that accepts the wrong password, or a token that drops the role.
- `EditorGuard` and `AdminGuard`. A guard that trusts an unverified role, or treats the roles as equal.
- `POST /api/login`. A handler that answers 201 or 500 for a bad password.
- `savePasswordHash` then `findCredential`. A column the seed never writes.

## Comments

https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/20
