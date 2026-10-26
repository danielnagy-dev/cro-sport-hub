# 22: Studio login

**What to build:** A studio login screen at `/login` that calls `POST /api/login`, keeps the JWT session, and lets only an editor or an admin into the studio. This note is the spec.

**Blocked by:** Plan item 10, resolved in PR #20 (ADR-004).

**Status:** resolved

## Scope

In: `/login`, the session (token, id, role, expiry), a bearer interceptor, logout, expiry back to `/login`, `editorGuard` (editor and admin), and `adminGuard` (admin only, not attached to a page). The form is keyboard usable: labels, announced errors, and focus on the first problem.

Out: match writes, guarding API routes, a shared login schema, admin pages, password reset, and real match reads. The match list stays the in-app stub. No new dependency and no change under `apps/api`.

## Order

Plan, then architect (sketch only, below), then develop. Pre-launch: the author self-reviews. Daniel squash-merges. That merge is the final gate.

## Acceptance

- [x] `POST /api/login` with `{ id, password }` stores the returned token. A 401 or a 400 leaves no session. A network failure does not either.
- [x] An editor and an admin can open `/`. A guest, or an expired token, lands on `/login`. An editor cannot open an admin-only route. An admin can.
- [x] API calls send `Authorization: Bearer`. A 401 on any call except login clears the session and returns to `/login`.
- [x] Logout, and a token that reaches its `exp`, return to `/login`.
- [x] The form has labels, `autocomplete`, and errors a keyboard user can reach. Empty and illegal ids do not call the API.

## Verification

`vp run verify:studio` screenshots `/login`. The shell list stays on `vp run studio#test` because the verify CLI has no session. Login 200 and 401 are the studio unit tests. The dev server proxies `/api` to `http://localhost:3001`. The stub still answers `GET /api/sports` and `GET /api/matches`.

## Architect

No ADR. ADR-004 already chose the token. Revisit of a shared login schema: not in this PR. The API still owns the request check, and `libs/shared-types` already exports `roleSchema` and `idSchema`. The studio reads `sub`, `role`, and `exp` from the payload and does not verify the signature. The API remains the verifier. A shared `{ token }` schema waits until `apps/api` imports it. No new runtime dependency. Studio does not import the API.

Rejected: localStorage (the token would outlive the tab), a client signing key, and attaching `adminGuard` to a placeholder page.

### Sketch

- `readSession(token, now) -> Session | undefined`. `Session` is `{ token, id, role, exp }`. `exp` is the JWT seconds. Expired, malformed, and unknown roles are `undefined`.
- `AuthStore.signIn({ id, password }) -> "ok" | "invalid" | "rejected"`. `logOut()` and `dropIfExpired()`. The token is stored in `sessionStorage` under `studio.token`.
- `editorGuard` allows `editor` and `admin`. `adminGuard` allows `admin`. Anyone else goes to `/login`. A signed-in user on an admin route without the role goes to `/`. `guestGuard` sends a session away from `/login`.
- `authInterceptor` adds the bearer and calls `logOut()` on a non-login 401. `App` watches the session and navigates to `/login` after a session ends.

### Seams

- `readSession`. An expired token, or a payload without `role`, that still counts as a session.
- `AuthStore.signIn` and `logOut`. A 401 that stores a token, or a timer that ignores `exp`.
- `editorGuard` and `adminGuard`. A guest in the studio, or an editor treated as an admin.
- `authInterceptor`. A call with no bearer, or a 401 that keeps the session.
- The login form. A submit that skips the error text, or a POST before the id is valid.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/23
