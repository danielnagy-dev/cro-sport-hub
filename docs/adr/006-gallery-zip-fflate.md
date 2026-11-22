# ADR-006: Gallery ZIP download with `fflate`

## Status

Accepted — **product path deprecated**. The `fflate` choice for in-process ZIP bytes remains valid while the gallery download route exists. ADR-010 and Phase G retire gallery admin / ZIP download as the ongoing publish surface in favour of publish-slot ordered slides (appearance ids in `slideOrder`) plus the thin ADR-003 appearance-payload renderer. Do not add new product callers of this path. Delete the route and dependency usage in Phase H / expand–contract drop (#186 and later H tickets), not in Phase G.

## Context

Plan item 30e adds `GET /api/galleries/:id/download` in `apps/api`. Editors and admins receive a ZIP of rendered slide PNGs when a gallery is published and every slide has bytes. ADR-001 keeps `allowBuilds` as an explicit list. The archive must be built in process without hand-rolling the ZIP format.

## Decision

Use `fflate` in `apps/api` only. `downloadGalleryZip` loads PNG bytes from the catalog, names entries `01.png`, `02.png`, in `slide_index` order, and returns `zipSync` output as the HTTP body. Bearer auth matches the other gallery routes; there is no public download URL.

Rejected: hand-rolled ZIP headers and central directory records, because the format is easy to get wrong and tests would duplicate a library. Rejected: `jszip` and `archiver`, because they pull a larger dependency surface for one synchronous archive. Rejected: streaming ZIP writers, because gallery slide counts are small and the PGLite suite asserts entry order and bytes in one response.

## Consequences

Callers use the download route with `Authorization: Bearer`. Draft, review, and published galleries with a missing PNG receive HTTP 409 with the messages in the OpenAPI conflict description. No new `allowBuilds` entry. Revisit only if archives must stream without buffering the full ZIP in memory.

Supersession for implementers: treat ZIP download as a retired product surface after Phase G/H. New editorial and publish work follows ADR-003’s appearance-payload contract and publish-slot `slideOrder`, not this gallery ZIP. Cleanup tickets remove `apps/*/feature/gallery`, gallery API download, and the `fflate` usage when the expand–contract drop is ready; this ADR does not authorize deleting that code in the Phase G ADR-only or API-narrow slices.
