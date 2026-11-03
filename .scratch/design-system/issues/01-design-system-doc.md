# 01: Design system documentation

**What to build:** Add Daniel's approved cro-sport-hub design system (2026-11-03) as English documentation under `docs/`, linked from `AGENTS.md` and ADR-003. Docs only; no generator code changes.

**Status:** claimed

**Size:** ~400 counted lines (documentation body plus index links).

## Scope

In: `docs/design-system.md` (and splits only if the file-size guard requires it), a short "Not yet implemented in code" section for known gaps vs `libs/slide-generator`, links from `AGENTS.md` and `docs/adr/003-slide-renderer.md`.

Out: Changes under `libs/slide-generator/`, feature-map entries (no user route), handoff PNG or HTML updates.

## Acceptance

- [ ] Approved design system content lives under `docs/` in English.
- [ ] Hero cell size remains marked open.
- [ ] Gaps vs `football.ts` are listed without implementing them.
- [ ] `format-check`, `lint`, `guards`, and `pr-body` pass.

## Verification

Docs only: `format-check`, `lint`, `guards`, `pr-body`. No build, test, or verify.

## Comments

- https://cursor.com/codebase/danielnagy/cro-sport-hub/pull/46