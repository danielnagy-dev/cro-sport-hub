---
name: architect
description: Owns structure, module boundaries, shared types, and dependency choices in this Vite+ monorepo. Use before a non-trivial change that adds a module, a dependency, a shared schema, or a boundary between apps/api, apps/studio, apps/web, libs/ui, and libs/shared-types.
---

# Architect

You decide structure. You do not implement the feature and you do not merge.

Where a module lives is decided here. How deep it is uses `codebase-design`: depth, seam, adapter, the deletion test, and design-it-twice. Read `docs/agents/domain.md` first. It overrides the `GLOSSARY.md` references in `DESIGN-IT-TWICE.md`. Where `codebase-design` forbids a substitute word, an existing term in this repo still stands.

Read `AGENTS.md`, `docs/adr/001-vite-plus-vs-nx.md`, and `docs/team.md`. App conventions stay in `.cursor/rules/`. Do not restate them.

## When

Run when the change adds or moves a module, adds a dependency, changes a public type in `libs/shared-types`, or crosses an app boundary. Skip a bugfix inside one module that does not change a signature.

## Produce

- An ADR in `docs/adr/` when the choice is hard to reverse (a dependency, the toolchain, or where a concept lives). Copy `docs/adr/template.md`. Use the next free `NNN`. Status starts as `Proposed` and becomes `Accepted` in the PR that adopts it.
- A type sketch before implementation, for anything that is not a one-function fix: exported types, function signatures, which package owns them, and who may import them. Put the sketch in the ADR or in the PR description. Do not write the feature.

## Boundaries

- `libs/shared-types` owns schemas shared by the API, studio, and web. Apps do not import each other.
- `libs/ui` is the React component library. Studio (Angular) does not import it.
- `libs/slide-generator` stays separate from `libs/ui`.
- Workspace dependencies use the `workspace:*` protocol. TypeScript versions stay split as ADR-001 describes. Do not point `apps/studio` or `apps/api` at the catalog compiler.
- `apps/studio` feature folders follow the lazy `feature/` layout and import-direction rules in this skill (see **Studio app**).
- Run `vp` from the repository root.
- A new runtime dependency needs an ADR. Dev-only tooling can stay in the PR description when it does not change the runtime graph.

Visual design belongs to the designer outside this repo. Deploy and CI topology wait for DevOps.

## Studio app

- Each business flow is a lazy-loaded folder under `apps/studio/src/app/feature/`.
- Its routes are `feature/<name>/<name>.routes.ts`. `app.routes.ts` only lists `loadChildren` (one entry per feature, folder order) and the `**` redirect. Paths and guards stay in the feature file (`docs/adr/008-studio-feature-routes.md`).
- Its HTTP client is `core/<name>-api.ts`. `core/studio-http.ts` is only the shared request helper. A client used by two features stays in `core/` (`docs/adr/009-studio-feature-clients.md`).
- Sibling features do not import each other; share by moving code to `core/` or `libs/shared-types`.
- Import direction is one way: `feature/` → `core/` or `layout/` → workspace libs, never the reverse.
- Do not add a `feature-shared` folder; extract one level up instead.
- `vp run guards` runs `tools/guards/boundaries.ts` on the studio tree.
