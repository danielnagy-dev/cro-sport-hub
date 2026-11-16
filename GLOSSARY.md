# Domain glossary

Canonical vocabulary for **Cro Sport Hub**. Use these English identifiers in code, APIs, and English docs. Croatian appears on football slides and in design handoffs; Studio and the public web use English UI copy today.

**Synonyms to avoid**

| Prefer (code)                               | Do not use for the same thing                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `competition`                               | league (design comments only)                                                  |
| `team`                                      | club in SQL/types (`club` is prose and slide copy)                             |
| `athlete`                                   | player in persistence (tennis uses `playerA` / `playerB` on match rows only)   |
| `appearance`                                | lineup row, performance, nastup (prose OK)                                     |
| `round`                                     | matchday number without the stored label (value is free text, e.g. `10. kolo`) |
| `status` `draft` \| `review` \| `published` | approved, live, pending                                                        |

## Applications and packages

| English (canonical)    | Croatian (where used)         | Definition                                                               | Where                                      |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------ | ------------------------------------------ |
| Cro Sport Hub          | —                             | Product name for the Croatian sports results hub.                        | Studio shell, web `main`, OpenAPI title    |
| Studio                 | —                             | Angular editorial app: matches, review, galleries, admin.                | `apps/studio`                              |
| Web (public site)      | javna web stranica (informal) | Next.js site for published results and athlete profiles.                 | `apps/web`                                 |
| API                    | —                             | NestJS HTTP API and catalog persistence.                                 | `apps/api`                                 |
| Catalog                | —                             | Postgres schema, migrations, and read/write layer for all domain tables. | `apps/api/src/catalog/`, SQL `0001`–`0008` |
| `libs/shared-types`    | —                             | Zod schemas and types shared across apps.                                | `libs/shared-types/src/`                   |
| `libs/ui`              | —                             | Shared React components for web and Storybook.                           | `libs/ui/src/`                             |
| `libs/slide-generator` | —                             | Football slide HTML/CSS and PNG rendering (1080×1350).                   | `libs/slide-generator/src/`                |

## Sports and catalog entities

| English (canonical) | Croatian (where used)    | Definition                                                             | Where                                                     |
| ------------------- | ------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| Sport               | sport                    | Top-level discipline; v1 is `tennis` or `football`.                    | Table `sports`, `sportSlugSchema`                         |
| Competition         | natjecanje               | Named tournament or league season slice editors attach to every match. | Table `competitions`, `competitionSchema`                 |
| Season              | sezona                   | Season label on a competition row (text, not a separate table).        | `competitions.season`, `seasonSchema`                     |
| Competition level   | —                        | `domestic` or `international` on a competition.                        | `competitionLevelSchema`                                  |
| Team                | klub, momčad (slides)    | Football club record: name, slug, crest; not national teams in v1.     | Table `teams`, `teamSchema`; slides `FootballPerson.club` |
| Athlete             | sportaš / igrač (slides) | Person who plays tennis or football; has slug and optional position.   | Table `athletes`, `athleteSchema`                         |
| Athlete–team spell  | klub (history)           | Date-bounded membership linking a football athlete to a team.          | Table `athlete_teams`, `athleteTeamSchema`                |
| User                | —                        | Studio account with `editor` or `admin` role.                          | Table `users`, `roleSchema`                               |
| Slug                | —                        | URL-safe public identifier for athletes (and team slugs in catalog).   | `slugSchema`, `/athletes/{slug}`                          |
| Crest               | grb                      | Optional HTTPS image URL for a team.                                   | `teams.crest_url`, `crestUrl`                             |

## Match (shared)

| English (canonical) | Croatian (where used) | Definition                                                                    | Where                                      |
| ------------------- | --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| Match               | utakmica              | Editorial result row for one fixture; sport-specific detail in child tables.  | Table `matches`, `matchSchema`             |
| Round               | kolo                  | Free-text round label on a match (e.g. `9. kolo`), not a normalized round id. | `matches.round`, `roundSchema`             |
| Match status        | —                     | `draft` → `review` → `published` workflow for editorial content.              | `statusSchema`, `matches.status`           |
| Match source        | —                     | `manual` (Studio entry) or `import` (batch job).                              | `matchSourceSchema`, `matches.source`      |
| Source ref          | —                     | External id required when `source` is `import`; must be null for manual.      | `matches.source_ref`                       |
| Submit for review   | —                     | Editor moves a draft match or gallery to `review`.                            | `workflow.ts`, `POST .../submit`           |
| Reject              | —                     | Admin returns a match or gallery in `review` to `draft`.                      | `rejectMatch`, `POST .../reject`           |
| Publish             | —                     | Admin sets `published`, records reviewer and timestamp.                       | `publishMatch`, `matches.published_at`     |
| Review queue        | —                     | Studio list filter `status=review` for matches awaiting admin.                | `studio.shell`, `/matches?status=review`   |
| Published match     | —                     | Public list DTO with competition name and sport-specific score fields.        | `publishedMatchSchema`, `GET /api/matches` |
| Match label         | —                     | Human summary in editor lists (e.g. player names or home vs away).            | Editor match list, `review-api.ts`         |

## Tennis

| English (canonical) | Croatian (where used) | Definition                                                                            | Where                                         |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------- |
| Tennis match        | teniska utakmica      | Extension row: two athletes, winner, `bestOf`, set `score`, optional `retired`.       | Table `tennis_matches`, `tennisMatchSchema`   |
| Player A / Player B | igrač                 | The two sides in catalog and forms (`playerAId`, `playerBId`).                        | `tennis_matches`, editor tennis draft         |
| Set                 | set                   | One element of `score`: games for A and B, optional tiebreak points for loser on 7–6. | `tennisSetSchema`, `tennis-score.ts`          |
| Tiebreak            | tie-break             | Third number on a 7–6 set: loser's tiebreak points only.                              | `tennis-score.ts` comments                    |
| Best of             | —                     | `3` or `5` sets format; constrains valid finished scores.                             | `tennisBestOfSchema`                          |
| Retired             | predaja               | Incomplete last set allowed; match not finished by normal set count.                  | `tennis_matches.retired`                      |
| Tennis match stats  | —                     | Per-athlete serve and break counts for a published tennis match.                      | Table `tennis_match_stats`, `tennis-stats.ts` |
| Winner (public)     | —                     | `'a'` or `'b'` on published cards, not athlete id.                                    | `publishedMatchSchema` (tennis)               |

## Football

| English (canonical)   | Croatian (where used) | Definition                                                                | Where                                           |
| --------------------- | --------------------- | ------------------------------------------------------------------------- | ----------------------------------------------- |
| Football match        | nogometna utakmica    | Extension row: home/away team ids and goal counts; draws allowed.         | Table `football_matches`, `footballMatchSchema` |
| Home team / Away team | domaćin / gost        | The two clubs in a fixture.                                               | `home_team_id`, `away_team_id`                  |
| Appearance            | nastup                | One athlete's participation in a football match with minutes and stats.   | Table `appearances`, `appearanceSchema`         |
| Started               | —                     | Whether the athlete was in the starting lineup.                           | `appearances.started`                           |
| Minutes               | minute                | Minutes played (0–130); zero minutes restricts goals/assists/start flags. | Slides label `MINUTE`                           |
| Goals                 | golovi                | Goals scored in the match.                                                | Slides label `GOLOVI`                           |
| Assists               | asistencije           | Assists in the match.                                                     | Slides label `ASIST.`                           |
| Yellow card           | žuti karton           | Count 0–2 on an appearance.                                               | `yellow_cards`, slide `Žuti`                    |
| Red card              | crveni karton         | Sending-off flag; two yellows use separate fields.                        | `red_card`, slide `Crveni`                      |
| Second yellow         | drugi žuti            | UI label when `yellowCards >= 2` (includes sending-off display).          | `appearances-table.tsx`, `CARD_VALUE_LEGACY`    |
| Position              | pozicija              | Free-text role on athlete or slide (e.g. `napadač`, `desni bek`).         | `athletes.position`, slide HTML                 |
| Card (enum)           | karton                | Display enum `yellow` \| `red`; not a DB column on appearances.           | `cardTypeSchema`                                |

## Galleries and slides

| English (canonical) | Croatian (where used) | Definition                                                                                    | Where                                  |
| ------------------- | --------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------- |
| Gallery             | galerija              | Ordered set of slides built from published football matches; same status workflow as matches. | Table `galleries`, `galleryViewSchema` |
| Gallery slide       | slajd                 | One slide in a gallery: index, `match_id`, optional caption, JSON `payload`, optional `png`.  | Table `gallery_slides`                 |
| Caption             | —                     | Optional per-slide text (max 500 chars).                                                      | `galleryCaptionPatchSchema`            |
| Slide payload       | —                     | JSON snapshot used to render the slide (stats as text; no shirt number in v1).                | `gallery_slides.payload`, ADR-003      |
| Slide PNG           | —                     | Rendered 1080×1350 image bytes after render job.                                              | `gallery_slides.png`, ADR-006          |
| Football entry      | —                     | One appearance mapped to competition, round, date, and `FootballPerson`.                      | `FootballEntry`, `catalog-slides.ts`   |
| Player slide        | —                     | Single-athlete slide (`kind: 'player'`).                                                      | `footballSlides`, ADR-003              |
| List slide          | —                     | Up to four athletes sharing one round heading (`kind: 'list'`).                               | `slides.ts`, `LIST_LIMIT`              |
| Colourway           | —                     | Slide theme `navy`, `red`, or `light`.                                                        | `Colourway`, `football.ts`             |
| Design round        | —                     | Template generation label (e.g. `13-interim`); not the match `round` field.                   | `designRound` in `football.ts`         |

## Import and admin

| English (canonical) | Croatian (where used) | Definition                                                               | Where                                    |
| ------------------- | --------------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| Import run          | uvoz                  | Log row for a batch import: counts and error text.                       | Table `import_runs`, Studio import admin |
| Editor              | urednik               | Role that creates drafts and submits; cannot publish or admin catalog.   | `users.role`, Studio                     |
| Admin               | administrator         | Role that publishes, rejects, and maintains competitions and teams.      | `users.role`, `/admin/*`                 |
| Editor lookup       | —                     | Read-only lists for forms (`/api/editor/competitions`, athletes, teams). | `editor-lookups.ts`                      |
| Competition admin   | —                     | CRUD on competitions; delete blocked when matches reference the row.     | `competition-admin.ts`                   |
| Team admin          | —                     | CRUD on football teams.                                                  | Studio teams admin                       |
| Seed                | —                     | Deterministic demo data for dev, tests, and verify (not real people).    | `catalog/seed.ts`, `CODING_STANDARDS.md` |

## Auth and public UI

| English (canonical) | Croatian (where used) | Definition                                                                  | Where                           |
| ------------------- | --------------------- | --------------------------------------------------------------------------- | ------------------------------- |
| Bearer token        | —                     | JWT from `POST /api/login` used by Studio for API calls.                    | `apps/api/src/auth/`            |
| MatchCard           | —                     | Shared UI component for a published result on web home and sport pages.     | `libs/ui/match-card.tsx`        |
| Appearances table   | —                     | Football profile table for published appearances.                           | `libs/ui/appearances-table.tsx` |
| Athlete header      | —                     | Profile header with name, country, sport, optional birth year and position. | `libs/ui/athlete-header.tsx`    |
| Tennis stats        | —                     | Percentage display from raw tennis match stat counts.                       | `libs/ui/tennis-stats.tsx`      |
