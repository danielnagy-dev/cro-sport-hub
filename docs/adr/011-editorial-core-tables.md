# ADR-011: Editorial core tables

## Status

Accepted

## Context

ADR-010 names Athlete, NationalTeam, Appearance, and Lineup / appearance-stats as the editorial unit that replaces match-centric workflow. Phase C slice 1 landed Zod enums in `libs/shared-types` (`sportSlug` + basketball, `appearanceStatus`, and related publish enums). Slice 2 must add Postgres + Drizzle shapes under `apps/api` without dropping the live match/gallery path (expand–contract; drop is Phase H / rewrite plan C5).

Packages touched by the adopting migration: `apps/api` (catalog SQL + `schema.ts` + remaps for the renamed legacy table). `libs/shared-types` entity Zod objects and seed rewrite wait for later slices. Studio and web do not import catalog tables.

Name collision: today `appearances` is the football **player-in-match** stats table (`match_id` + `athlete_id`, minutes/goals/…). ADR-010 **Appearance** is a scheduled or completed participation (athlete **or** national team). Those must not share one table.

## Decision

### Expand–contract

1. **Rename** legacy `appearances` → `match_appearances` in one additive migration (`ALTER TABLE … RENAME` + index renames). Remap Drizzle (`matchAppearances`) and every catalog / feature caller that still reads football match player rows. Do not change football semantics in this slice.
2. **Create** ADR-010 tables: `national_teams`, `appearances`, `lineup_entries`.
3. **Extend** `sports` / athlete sport checks for `basketball` (seed `sport-basketball`). Keep existing `teams` as club records; national selections are not clubs.
4. Leave `matches`, `*_matches`, galleries, and match workflow tables in place until Phase H.

### Table shapes (v1)

Column types follow the catalog style already on `main` (`text` ids, composite sport FKs where useful). Timestamps that drive “u tijeku” are Postgres `timestamptz` (not date-only).

#### `sports` (extend)

- Allow slug `basketball` beside `tennis` / `football`.
- Seed row `sport-basketball` / Basketball (`ON CONFLICT DO NOTHING`).

#### `athletes` (extend in place)

Keep existing columns. Add optional `club_name text` for non-football club labels (tennis / basketball) without forcing `athlete_teams`. Football club history stays on `athlete_teams` → `teams`. No national-team membership table in this slice (lineup covers team-appearance counting on profiles).

#### `national_teams` (new)

| Column       | Type        | Notes                                      |
| ------------ | ----------- | ------------------------------------------ |
| `id`         | text PK     |                                            |
| `sport_id`   | text        | FK → `sports(id)`                          |
| `sport_slug` | text        | with `sport_id` → `sports(id, slug)`       |
| `slug`       | text UNIQUE | URL-safe                                   |
| `name`       | text        | Display name                               |
| `selection`  | text        | e.g. senior / A / B (free text v1)         |
| `age_band`   | text        | e.g. U21, senior (free text v1)            |
| `sex`        | text NULL   | `open` \| `women` \| `men` when needed     |
| `country`    | text        | ISO country code (Croatia default in seed) |

Indexes: `(sport_slug)`, unique `(sport_slug, slug)` already via slug uniqueness if slugs are globally unique — prefer **global unique slug** like athletes.

#### `appearances` (new — ADR-010 entity)

One list row: participant is **exactly one** of athlete or national team.

| Column             | Type             | Notes                                                     |
| ------------------ | ---------------- | --------------------------------------------------------- |
| `id`               | text PK          |                                                           |
| `sport_id`         | text             |                                                           |
| `sport_slug`       | text             | CHECK in `tennis` \| `football` \| `basketball`           |
| `competition_id`   | text             | FK → `competitions(id)`                                   |
| `athlete_id`       | text NULL        | FK → `athletes` when individual                           |
| `athlete_sport`    | text NULL        | composite athlete FK                                      |
| `national_team_id` | text NULL        | FK → `national_teams` when team row                       |
| `opponent_label`   | text             | Free-text opponent (tracked opponent FKs later)           |
| `starts_at`        | timestamptz      | Required                                                  |
| `ends_at`          | timestamptz NULL | Optional until known                                      |
| `status`           | text             | CHECK = `appearanceStatusSchema` values                   |
| `result`           | jsonb NULL       | Sport-agnostic score/summary blob; refine per sport later |
| `creator_kind`     | text             | `bot` \| `manual`                                         |
| `created_at`       | timestamptz      |                                                           |
| `updated_at`       | timestamptz      |                                                           |

Constraints:

- `CHECK ((athlete_id IS NOT NULL AND national_team_id IS NULL) OR (athlete_id IS NULL AND national_team_id IS NOT NULL))`
- When `athlete_id` set, `athlete_sport` set and matches `sport_slug`; when national team, `national_team_id`’s sport matches `sport_slug`.
- Index `(starts_at, sport_slug)`, `(athlete_id, starts_at)`, `(national_team_id, starts_at)`, `(status, starts_at)`.

Sources / disagreement flags and publish FKs are **out** (Phase C slice 3).

#### `lineup_entries` (new — Lineup / appearance-stats)

Who played on an appearance (required for national-team rows so individual profiles still count the nastup; optional for athlete-participant rows when useful).

| Column          | Type         | Notes                                    |
| --------------- | ------------ | ---------------------------------------- |
| `appearance_id` | text         | FK → `appearances(id)`                   |
| `athlete_id`    | text         |                                          |
| `athlete_sport` | text         | composite FK → `athletes`                |
| `started`       | boolean      | Starting lineup / not                    |
| `minutes`       | integer NULL | When known                               |
| `stats`         | jsonb        | Sport-specific counts (goals, points, …) |

Primary key `(appearance_id, athlete_id)`. Index `(athlete_id)`.

**Rejected for v1:** separate typed `football_lineup_*` / `tennis_*` / `basketball_*` stats tables — ADR-010 defers sport-specific refinement; jsonb keeps one migration under size. Typed columns may land later without changing the PK.

#### Legacy `match_appearances` (renamed)

Same columns as today’s `appearances` (football match player stats). Drizzle export `matchAppearances`. Callers under `apps/api` that still serve match workflow remap; no Studio/web rename of product language required until Phase H.

### Type sketch (ownership)

| Symbol                                                                      | Owner                            | Importers                                                         |
| --------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------- |
| Drizzle `nationalTeams`, `appearances`, `lineupEntries`, `matchAppearances` | `apps/api/src/catalog/schema.ts` | catalog + API features only                                       |
| SQL migration `0009_…sql` (name chosen by implementer; next free `0009`)    | `apps/api/src/catalog/`          | migration runner                                                  |
| Zod entity objects for Appearance / NationalTeam / Lineup                   | `libs/shared-types`              | **not** this slice (follow-up with API or a thin shared-types PR) |
| Enums already on main                                                       | `libs/shared-types`              | reuse for CHECK lists / later Zod                                 |

No new runtime dependency. Still Drizzle + hand-written SQL (ADR-002); no `drizzle-kit`.

### Rejected alternatives

**Keep legacy table named `appearances` and invent `editorial_appearances`.** Violates ADR-010 naming in the schema until Phase H; easy to wire the wrong table.

**Drop or stop writing `matches` in this slice.** Breaks Studio/web still on match IA; expand–contract forbids it.

**Polymorphic `participant_kind` + `participant_id` without dual FKs.** Weaker referential integrity; two nullable FKs + XOR check is enough for v1.

**Opponent as required FK to `teams` / athletes.** Tennis and foreign clubs are often untracked; `opponent_label` text first.

## Consequences

- Implement Phase C slice 2 as one migration PR that renames legacy football player rows, adds the three new tables, extends sports/athletes, remaps Drizzle + existing match-appearance callers, and extends migration tests. Do not seed the full editorial demo set (slice 4) or add publish tables (slice 3).
- Later API tickets (`rewrite.D*`) read `appearances` / `lineup_entries` / `national_teams` only; they must not query `match_appearances` for the new product path.
- Update `GLOSSARY.md` Appearance / NationalTeam rows when the migration lands (or in the same PR if size allows). Match-centric glossary rows stay until Phase H.
- Do not parallel another catalog migration with this slice.
