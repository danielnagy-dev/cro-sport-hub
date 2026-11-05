# ADR-006: Gallery ZIP download with `fflate`

## Status

Accepted

## Context

Plan item 30e adds `GET /api/galleries/:id/download` in `apps/api`. Editors and admins receive a ZIP of rendered slide PNGs when a gallery is published and every slide has bytes. ADR-001 keeps `allowBuilds` as an explicit list. The archive must be built in process without hand-rolling the ZIP format.

## Decision

Use `fflate` in `apps/api` only. `downloadGalleryZip` loads PNG bytes from the catalog, names entries `01.png`, `02.png`, in `slide_index` order, and returns `zipSync` output as the HTTP body. Bearer auth matches the other gallery routes; there is no public download URL.

Rejected: hand-rolled ZIP headers and central directory records, because the format is easy to get wrong and tests would duplicate a library. Rejected: `jszip` and `archiver`, because they pull a larger dependency surface for one synchronous archive. Rejected: streaming ZIP writers, because gallery slide counts are small and the PGLite suite asserts entry order and bytes in one response.

## Consequences

Callers use the download route with `Authorization: Bearer`. Draft, review, and published galleries with a missing PNG receive HTTP 409 with the messages in the OpenAPI conflict description. No new `allowBuilds` entry. Revisit only if archives must stream without buffering the full ZIP in memory.
