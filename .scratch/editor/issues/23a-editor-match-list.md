# 23a: Editorial match list

**What to build:** An editor can list matches across tennis and football, filtered by sport, status, and source. The public list stays published-only. This note is the spec.

**Blocked by:** None. Plan item 11b is on main (PR #24), so the editorial read follows the draft writes. `EditorGuard` is on main.

**Status:** ready-for-agent

**Size:** 300 counted lines. One guarded list. The public list's joins already know how to name the two sides; this query is that select plus the workflow columns.

## Scope

In: `GET /api/editor/matches`. Query `sport` (`tennis` or `football`, optional), `status` (`draft`, `review`, or `published`, optional), `source` (`manual` or `import`, optional), `limit` (default 20, max 50), `offset` (default 0). A bad query is HTTP 400 with the same style of message as the public list. Newest `match_date` first, `id` as the tie-break. Each item is `{ id, sport, competition, date, round, status, source, label }`. The label is `Player A vs Player B` or `Home vs Away` using the stored names. Drafts are included. No stat counts and no club id. Editor or admin. Missing token is HTTP 401 `Invalid token`. A signed role other than editor or admin is HTTP 403 `Forbidden`. `GET /api/matches` still returns published rows only. OpenAPI marks the editor path with bearer security.

Out: the studio table (23b) and lookups for the forms (24a). No new dependency and no ADR. Update `docs/feature-map.md` with `api.editor-matches`.

## Order

Plan is this note. Architect sketches `editorMatchPageSchema` in `libs/shared-types`, then develop. No ADR. The author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] An editor token and no filters returns the seeded published final, the seeded published league match, and the draft quarterfinal. A newer unpublished football row is included when the test inserts one.
- [ ] `status=draft` returns the quarterfinal and omits the final. `sport=football` omits every tennis row. `source=import` is an empty page on the seed.
- [ ] The tennis label is `Sample Player A vs Sample Player B`. The football label is `Sample Home vs Sample Away`. The JSON has no club id.
- [ ] `limit=0` is HTTP 400. No token is HTTP 401. `GET /api/matches` with no token stays HTTP 200 and still omits the draft.
- [ ] `/docs-json` documents `/api/editor/matches` with bearer security.

## Verification

PGLite HTTP suite. `vp run verify:api --route /api/matches` checks the public list. The editor path needs a bearer, which verify does not send. Say that.

## Architect

Yes, for `editorMatchPageSchema` in `libs/shared-types`. No ADR. It is a read model, not a new catalog kind. The handler is the seam. Studio does not import the API.

### Seams

- `GET /api/editor/matches` on the seeded catalog. Catches a draft dropped from an unfiltered list, a filter that leaks the other sport, and a public list that starts returning drafts.
- `GET /docs-json`. Catches the editor path with no bearer scheme.
