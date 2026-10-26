# 9a: Cache the published match reads

**What to build:** `GET /api/matches` and `GET /api/matches/:sport` read Redis first. A miss stores the page for 60 seconds. A Redis error still returns the catalog page. This note is the spec.

**Blocked by:** 8b and 8c, so plan item 8 is complete before the `pub:v1:` keys exist. The match routes themselves are already on main.

**Status:** ready-for-agent

**Size:** 280 counted lines. A wrapper and the hit, miss, key, and failure tests around `listPublishedMatches`. The query stays.

## Scope

In: a cache in front of the two match reads. Key `pub:v1:matches:` plus `all` or the sport slug, plus `limit` and `offset`. TTL 60 seconds. The stored value is the JSON page. A second request with the same key does not call `listPublishedMatches`. A different limit, offset, or sport is a different key. If `GET` or `SET` throws, the handler returns the catalog page and responds 200.

Out: athlete keys and `invalidatePublicReads` (9b). No new dependency (`redis` is already how `/health` pings). No ADR. Tests use an in-memory fake, not Docker and not a real Redis. Update the `api.matches` gotcha in `docs/feature-map.md`: a reader can see a page for up to 60 seconds after the row changes, until 9b deletes the key.

## Order

Plan is this note. No architect step. Develop, then the author self-reviews. Daniel squash-merges.

## Acceptance

- [ ] A miss calls `listPublishedMatches` once and the next identical `GET /api/matches` does not call it again. The body is the same page.
- [ ] `GET /api/matches/football` and `GET /api/matches/tennis` do not share a key. `limit=1` does not share a key with the default page.
- [ ] A fake that throws on `GET` and on `SET` still yields the catalog page and HTTP 200.
- [ ] The TTL on the stored key is 60 seconds.

## Verification

`vp run verify:api --route /api/matches` when Docker is up. The hit and the thrown client are the unit tests, because verify only checks HTTP 200. Say that in the results table.

## Architect

No. `redis` is already a dependency of `apps/api`. The wrapper sits in the match handler. `libs/shared-types` stays as it is.

### Seams

- The wrapper around `listPublishedMatches`. Catches a hit that queries again, a key that drops the sport or the page, and a Redis error that becomes HTTP 500.
