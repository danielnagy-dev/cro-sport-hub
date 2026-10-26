# 32: v1 local README

**What to build:** The README tells a developer how to run the local v1, points at the ADRs, and shows the architecture. It marks v1 done locally only when every other ready ticket has merged. This note is the spec.

**Blocked by:** Every other ready ticket in `.scratch/plan-index.md`. Sport admin and user admin are dropped, not blockers. The `catalog.ts` split is a separate pull request and is not a blocker.

**Status:** ready-for-agent

**Size:** 200 counted lines. README, one diagram, and links. No application code.

## Scope

In: replace the scaffold README with how to run locally: `docker compose up`, `vp install`, `vp run dev`, and `vp run api#seed`. Name the demo ids `editor-demo` and `admin-demo` and the variable names `EDITOR_DEMO_PASSWORD`, `ADMIN_DEMO_PASSWORD`, and `JWT_SECRET`. Do not write a password, a hash, a token, or a phone number. A mermaid diagram of web, studio, API, Postgres, and Redis. An index of the ADRs in `docs/adr/` with one line each (Vite+ vs Nx, Drizzle, the slide renderer, JWT, and any later ADR that has landed). Screenshots are PNGs captured from verify runs of the merged apps, stored next to the README, using seed names only. A GIF is out: the repo has no recording step for the README.

The opening paragraph says v1 runs locally. It names sport admin and user admin as out of v1. It says the import timer is off unless `IMPORT_SCHEDULE` is `true`, and that the enabled interval is once per hour. It says gallery is in v1: football slides from catalog fields, one optional caption, and a ZIP of an approved gallery. It says the visitor and editor Playwright commands are local and are not in CI. It does not say v1 is done while a ready ticket is unmerged.

Out: deploy instructions, real athlete data, a public gallery page, and a README GIF. `docs/feature-map.md` stays the feature index; do not copy it into the README.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] A new clone can follow the README from Compose through seed without reading another doc. The commands are the ones the repo actually runs.
- [ ] The opening paragraph names sport admin and user admin as out of v1, and says the import timer is off unless `IMPORT_SCHEDULE=true`.
- [ ] The demo section names the two ids and the three variable names, and contains no secret value.
- [ ] The ADR index links `001` through `004` and any later ADR that has landed.
- [ ] The mermaid diagram includes web, studio, the API, Postgres, and Redis.
- [ ] Screenshots show seed names only. There is no GIF.

## Verification

Not applicable (no runtime change). Author runs `format-check`, `lint`, `guards`, and `--pr-body`.

## Architect

No. Docs only.

### Seams

None. There is no runtime behavior. The acceptance checks are the README text.
