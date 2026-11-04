# sb1: Studio feature boundaries and import guard

**What to build:** Restructure `apps/studio/src/app` into `core/` and lazy `feature/login` and `feature/editor`, document boundary rules in the architect skill, and enforce sibling-feature imports with `tools/guards/boundaries.ts`.

**Blocked by:** none

**Status:** claimed

**Size:** 118 counted lines raw, ~165 corrected (×1.4).

**Shared files:** `apps/studio/src/app/**`, `.cursor/skills/architect/SKILL.md`, `AGENTS.md`, `tools/guards/check.ts`, `.scratch/plan-index.md`

## Scope

In: `git mv` of auth, API, stub API, login, shell, and editor store into `core/` and `feature/`; lazy editor route; architect rules (~5 lines); `boundaries.ts` guard hooked into `check.ts`; plan-index row.

Out: layout folder (no separate layout piece); eslint-plugin-boundaries; Oxlint path rules; feature-map update (no user-visible route change).

## Order

This note, develop, author self-review. Daniel squash-merges.

## Acceptance

- [ ] `apps/studio/src/app/core/` holds auth, interceptors, and read API client; `feature/login` and `feature/editor` hold login and shell/editor store.
- [ ] Login and editor routes load with `loadComponent`.
- [ ] `vp run guards` fails on a sibling feature import, on `core/` importing `feature/`, and on a `feature-shared` folder name.
- [ ] Studio build and tests pass.

## Verification

`vp run studio#test`, `vp run build` for studio (via `vp run build` or studio task), `vp run lint`, `vp run guards`, `vp run typecheck`. `verify:api` skipped (Docker). `verify:studio` optional; routes unchanged.

## Architect

Yes. Structure and a new guard.

### Seams

- `boundaries.ts` self-test with synthetic import paths. Catches a missed violation kind.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/47
