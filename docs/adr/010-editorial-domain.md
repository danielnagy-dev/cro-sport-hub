# ADR-010: Editorial domain model

## Status

Accepted

## Context

Studio and the public web are still match-centric: editors create tennis or football matches, move them `draft → review → published`, and build football galleries (ADR-006 ZIP path) for social. Issue #149 proposed a mockup-led redesign of that IA. Product direction (2026-11-21) keeps the NestJS + Angular Studio + Next stack and rewrites the domain instead: Studio becomes a review/approve desk for social posts about Croatian athletes’ appearances; the public site shows who plays on a given day; a bot may draft from sources; nothing posts to Instagram, Facebook, or X without Daniel’s approval.

This ADR locks vocabulary and retirement so schema (`rewrite.C*`), API, Studio, and web tickets share one model. It does not migrate tables or change runtime code. Packages touched later: `apps/api`, `apps/studio`, `apps/web`, `libs/shared-types`, `libs/ui`, `libs/slide-generator`. Glossary updates land with those tickets; until then prefer the names below over match-workflow synonyms.

## Decision

### Stack

Keep NestJS API, Angular Studio, and Next.js public web. Rewrite model, API, and screens. Do not greenfield a new platform.

### Domain entities (v1)

| Name                          | Meaning                                                                                                                                                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Athlete**                   | Tracked person (slug, sport, profile fields). Shared by Studio and web.                                                                                                                                                                |
| **NationalTeam**              | National selection / age band as a participant when the row is a team appearance, not a club `Team`.                                                                                                                                   |
| **Appearance**                | One scheduled or completed participation: participant is an athlete **or** a national team (one list row for the team). Carries start/end, competition, opponent, status, sport-specific fields. Replaces match as the editorial unit. |
| **Lineup** / appearance-stats | Who played and sport-specific stats for an appearance (shape refined per sport in later tickets).                                                                                                                                      |
| **PublishSlot**               | Timed social-publish bucket for a day (clock times from settings). Holds ordered slides and links to network posts.                                                                                                                    |
| **NetworkPost**               | Per-network copy and status for Instagram, Facebook, or X; stores external post ids from day one.                                                                                                                                      |
| **Source**                    | Provenance URL plus `fetchedAt` (and later disagreement flags) attached to drafted data.                                                                                                                                               |
| **Audit**                     | Creator kind `bot` \| `manual` on drafted rows.                                                                                                                                                                                        |

v1 sports: `tennis`, `football`, `basketball`. Slot clock defaults live in settings (placeholders such as 15:30 / 22:00 until social-bot input), not hard-coded in feature modules.

### Publish meaning

There is no separate “publish to web” gate. Appearances are visible on the public site when data is ready. “Publish” means submit approved NetworkPosts to Instagram / Facebook / X. Web has no posts or editing.

### Retirement

Do not implement #149 as written (deferred / superseded). Retire the product surfaces below in dedicated cleanup tickets after replacements work; this ADR only names them:

- Studio match IA: `/matches`, tennis/football create forms, `/matches/:id/review`, home shortcuts to Matches / Review / New gallery / Admin.
- Match workflow status `draft → review → published` as a web gate.
- Gallery admin and ZIP download (ADR-006 product path). Keep a thin slide **template renderer** (ADR-003 family); slide count and athletes are known ahead of fill.
- Obsolete admin import UI as the product path; hourly import (ADR-005) becomes a bot draft seam, not Studio chrome.

Keep JWT auth (ADR-004), API feature folders (ADR-007), Studio feature routes/clients (ADR-008/009), monorepo / `libs/shared-types`, and slide visual tokens (`docs/design-system.md` for slides).

### UI kit (Phase B framing)

Own CSS + TypeScript contracts in `libs/ui` (no PrimeNG / Material). Variants use data attributes. Studio consumes shared tokens/CSS via thin Angular host adapters; it does not import React components from `libs/ui`. Reject a second Angular-only kit.

### Non-goals (v1)

Live scores, analytics UI, auto-post without approval, implementing #149 mockup IA, full multi-source crawler, or final social senders beyond an approve → send stub.

### Rejected alternatives

**Long-lived rewrite branch.** Diverges from `main` and blocks small PRs. Prefer expand–contract slices off `main`.

**Dual-run old match Studio beside new editorial Studio for months.** Wrong product stays visible; doubles shared-file conflict. Cut over once the vertical path works (pre-launch, seed data only).

**Separate web publish gate.** Conflicts with “appearances when data is ready” and conflates social approve with catalog visibility.

## Consequences

Later tickets must use these entity names in schemas, OpenAPI tags, Studio routes, and feature-map id files. Schema and shared-types work (`rewrite.C*`) may run in parallel with the UI kit (`rewrite.B*`) once this ADR is on `main`, without inventing conflicting table names. Do not cut #149 Phase 0 children. Agent tokens that cannot comment on #149 treat this ADR and issue `#161` as the supersession note.
