# Plan index

Planning snapshot for the remaining v1 items. This file is not `docs/agents/issue-tracker.md`. Develop PRs do not edit it. Status lives on the ticket. A later planning pass can replace this list.

Counted lines are code plus tests, the same count as `.cursor/skills/plan/SKILL.md`. Target 300. An estimate over 400 was split before `ready-for-agent`.

Already on main, and not re-ticketed: catalog and shutdown, match schema, football appearances, seed, public matches (7 and 7b), JWT login, `saveDraft` (11a, PR #22), draft routes (11b, PR #24), UI library and results, web shell, studio shell, studio login (22, PR #23), slide template and slide split, and the file-size guard (21b, PR #21). New source files have to stay under that guard.

Decisions written into the tickets, so develop does not invent them: an admin publishes and rejects, and an editor or an admin submits (the seed's `reviewedBy` is the admin, and the two guards already exist). Public cache TTL is 60 seconds and a Redis error still serves the catalog. Public athlete bodies use names, not club ids, matching the published match list. Import updates a draft and leaves a review or published row alone. No Open Graph image and no README GIF. Sport admin and user admin are out of v1. The import timer is off unless `IMPORT_SCHEDULE=true`, and then it runs once an hour. Gallery slides use catalog fields only: no shirt number, no stat the catalog does not store, stats as text with no donut, and one optional caption per slide. Visitor and editor Playwright stay local until deploy. There is no Compose job in CI.

## Order

Dependency order is the table. 8a merged as #28, 24a as #29, 12a as #30, and 13b as #31, so they are not started again. Which tickets may run at the same time is the Parallel section. #32 (13a) and #33 (23a) are open and share the API registration files, so they are not a parallel wave. 14a is open as #35 (import core) and #36 (admin routes), in the old layout. After #32, #33, #35, and #36 have merged, the next API work is af1, af2, and af5 together, then af3 with af6, then af4. 8b, 8c, 9a, 9b, 12b, 14b, and 30b–30e wait for af1, af3, and af5 even where the ticket file still names the older blocker. This index is that order. Then 8b, then 8c. Cache starts when 8c has merged. Publish (12b) starts when 12a and 9b have merged. 14b starts when 14a, af1, af3, and af5 have merged. Gallery persistence (30b) starts when 30a, af1, af3, and af5 have merged. Render (30c) and gallery review routes (30d) start when 30b has merged. The ZIP (30e) starts when 30c and 30d have merged. The studio composer (31a) starts when 30c and 23a have merged. Studio screens follow the API slice they call. Login is already on main. The README (32) is last among the v1 rows. It does not wait for af1–af6 or fmt. fmt runs when the forge has no open pull request.

| Id  | Title                                         | Estimate | Blockers                 | Status          |
| --- | --------------------------------------------- | -------: | ------------------------ | --------------- |
| 8a  | Athlete profile and club history              |      340 | none                     | resolved        |
| 18a | Latest results on the home page               |      300 | none                     | ready-for-agent |
| 13a | Admin competitions                            |      320 | none                     | ready-for-agent |
| 13b | Admin teams                                   |      300 | none                     | resolved        |
| 24a | Editor lookups for the forms                  |      260 | none                     | resolved        |
| 12a | Submit a draft and reject a review            |      320 | none                     | resolved        |
| 23a | Editorial match list                          |      300 | none                     | ready-for-agent |
| 14a | Import drafts from a fixture                  |      340 | none                     | ready-for-agent |
| 30a | Catalog fields on football slides             |      300 | none                     | ready-for-agent |
| 14b | Hourly import behind an env flag              |      260 | 14a, af1, af3, af5       | ready-for-agent |
| 30b | Create a gallery and edit captions            |      340 | 30a, af1, af3, af5       | ready-for-agent |
| 30c | Render gallery PNGs                           |      280 | 30b                      | ready-for-agent |
| 30d | Submit, reject, and publish a gallery         |      260 | 30b                      | ready-for-agent |
| 30e | Download an approved gallery as a ZIP         |      220 | 30c, 30d                 | ready-for-agent |
| 31a | Studio gallery composer                       |      320 | 30c, 23a                 | ready-for-agent |
| 8b  | Tennis results on the athlete read            |      320 | af1, af3, af5            | ready-for-agent |
| 8c  | Football appearances on the athlete read      |      300 | 8b                       | ready-for-agent |
| 9a  | Cache the published match reads               |      280 | 8b, 8c                   | ready-for-agent |
| 9b  | Cache athlete reads and the invalidation hook |      240 | 9a, 8b, 8c               | ready-for-agent |
| 12b | Publish a review and drop the public cache    |      220 | 12a, 9b                  | ready-for-agent |
| 18b | Tennis and football sport pages               |      280 | 18a                      | ready-for-agent |
| 23b | Studio matches table                          |      320 | 23a                      | ready-for-agent |
| 19a | Athlete profile page                          |      280 | 8a, 18b                  | ready-for-agent |
| 24b | Tennis score form                             |      340 | 24a, 23b                 | ready-for-agent |
| 19b | Tennis results on the athlete page            |      240 | 19a, 8b                  | ready-for-agent |
| 19c | Football appearances on the athlete page      |      220 | 19a, 8c                  | ready-for-agent |
| 20a | Sitemap                                       |      200 | 18b, 19a                 | ready-for-agent |
| 24c | Tennis stats and submit for review            |      280 | 24b, 12a                 | ready-for-agent |
| 24d | Reopen a tennis draft                         |      280 | 24c                      | ready-for-agent |
| 25a | Football score form                           |      280 | 24b, 24a                 | ready-for-agent |
| 20b | Visitor flow with axe                         |      280 | 19b, 18b                 | ready-for-agent |
| 25b | Football appearances and submit               |      320 | 25a, 24c                 | ready-for-agent |
| 25c | Reopen a football draft                       |      260 | 25b, 24d                 | ready-for-agent |
| 26a | Review, reject, and publish                   |      300 | 12b, 24d, 25c, 23b       | ready-for-agent |
| 26b | Editor flow through to the public list        |      300 | 26a, 18a                 | ready-for-agent |
| 27a | Studio competitions admin                     |      300 | 13a, 26a                 | ready-for-agent |
| 27b | Studio teams admin                            |      260 | 13b, 27a                 | ready-for-agent |
| 27c | Import log and Run now                        |      240 | 14a, 27a                 | ready-for-agent |
| 31b | Gallery review and ZIP download               |      280 | 31a, 30d, 30e, 26a       | ready-for-agent |
| 32  | v1 local README                               |      200 | every other ready ticket | ready-for-agent |
| sb1 | Studio feature boundaries and import guard    |      165 | none                     | claimed         |

Paths are `.scratch/<feature>/issues/<id>-<slug>.md`: `athletes` (8), `cache` (9), `matches` (12), `admin` (13), `import` (14a, 14b), `web` (18, 19, 20), `editor` (23a, 24a), `studio` (23b, 24b, 24c, 24d, 25, 26, 27, 31), `gallery` (30), `docs` (32), `api-features` (af1–af6), `format` (fmt).

## Parallel

Shared files are the existing paths a ticket edits (`.cursor/skills/plan/SKILL.md`). One ticket from each group may run with one ticket from every other group. Tickets in the same group run one at a time. These groups are the tree before ADR-007. After af5 and af6, a new id file is a new path and drops out of the area-file group.

| Group            | Shared paths                                                                                                                                                                                          | One at a time                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| API registration | `app.module.ts`, `openapi.ts`, `catalog/connection.ts`, `catalog/errors.ts`, `docs/feature-map/api.md`, and `libs/shared-types/src/index.ts` when a ticket adds an export. Full paths are in ADR-007. | 13a, 23a, 14a (#35, #36), then 8b, 8c, 9a, 9b, 12b, 14b, 30b, 30c, 30d, 30e |
| Web              | `docs/feature-map/web.md`                                                                                                                                                                             | 18a, 18b, 19a, 19b, 19c, 20a, 20b                                           |
| Studio           | `docs/feature-map/studio.md`                                                                                                                                                                          | 23b, 24b, 24c, 25a, 25b, 25c, 26a, 26b, 27a, 27b, 27c, 31a, 31b             |
| Slides           | files under `libs/slide-generator/` (no feature-map row)                                                                                                                                              | 30a                                                                         |
| API and studio   | `docs/feature-map/api.md` and `docs/feature-map/studio.md`                                                                                                                                            | 24d, alone                                                                  |
| Format           | `vite.config.ts` and every file the formatter rewrites                                                                                                                                                | fmt, alone, and only when no pull request is open                           |

30a may run with one web ticket and one studio ticket. It stays out of the API group. af1–af6 are the next table, not a member of the API cell. af2 and af3 hold the catalog files, so neither runs beside another API ticket.

## ADR-007

Implement `docs/adr/007-api-feature-files.md`. af2 and af3 both edit the catalog core, so they stay in sequence. af1 and af5 share no path with af2.

| Id  | Title                                       | Estimate | Blockers             | With     | Status          |
| --- | ------------------------------------------- | -------: | -------------------- | -------- | --------------- |
| af1 | Load API feature modules                    |      340 | #32, #33, #35, #36   | af2, af5 | ready-for-agent |
| af2 | Detach catalog reads from `Catalog`         |      260 | #32, #33, #35, #36   | af1, af5 | ready-for-agent |
| af3 | Detach catalog writes from `Catalog`        |      340 | af2                  | af6      | ready-for-agent |
| af4 | Collect migrations from the directory       |      160 | af3                  | af6      | ready-for-agent |
| af5 | One feature-map file per API id             |      340 | #32, #33, #35, #36   | af1, af2 | ready-for-agent |
| af6 | One feature-map file per studio, web, ui id |      360 | af5                  | af3, af4 | ready-for-agent |
| fmt | Single quotes, no semicolons                | over 400 | no open pull request | none     | ready-for-agent |

Paths: `.scratch/api-features/issues/0N-<slug>.md` and `.scratch/format/issues/01-quote-style.md`. fmt stays one pull request (plan skill, one-shot format).

## Decisions

Daniel closed the open questions on 26 Oct 2026. Nothing in this index is waiting on an answer.

1. **Sports admin** is out of v1. ADR-002 stays. Tennis and football remain the seeded pair. Callers do not insert sports. There is no ticket for sport CRUD.
2. **User admin** is out of v1. The only accounts are `editor-demo` and `admin-demo`. Passwords come from the environment (ADR-004). There is no ticket for user CRUD.
3. **Import timer** is 14b. `IMPORT_SCHEDULE` is off unless it is exactly `true`. When it is on, `runImport` runs once per hour. `vp run api#dev` does not import unless that flag is set. ADR-005 is written in that pull request.
4. **Gallery** is 30a through 30e and 31a, 31b. Slides show catalog fields only. No shirt number. No passes, saves, rating, or shots. Stats are text. No donut. One optional caption string per slide. ADR-003 records that. ADR-006 (the ZIP library) is written in 30e.
5. **Playwright** visitor (20b) and editor (26b) flows stay local until deploy. There is no Compose job in CI.
6. **`catalog.ts`** is being split in a separate pull request. It is a blocker for nothing in this index. `vp run guards` goes green for that file once the split merges. This plan does not edit it.

Sport admin and user admin have no API ticket and no studio ticket.
