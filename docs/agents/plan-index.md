# Plan index

GitHub Issues are the source of truth for open work. This file records order and which issues may run together. It has no status table. The convention is `docs/agents/issue-tracker.md`. Issue numbers here are GitHub issues. Older `PR #N` notes in history may be Cursor Origin numbers from before 2026-11-05.

## Order

An issue can start when every issue it links has merged, or its Blocked by section names only merged plan ids.

- No open blocker: [#51](https://github.com/danielnagy-dev/cro-sport-hub/issues/51) [14b], [#52](https://github.com/danielnagy-dev/cro-sport-hub/issues/52) [30b], [#57](https://github.com/danielnagy-dev/cro-sport-hub/issues/57) [9a], [#60](https://github.com/danielnagy-dev/cro-sport-hub/issues/60) [19b], [#61](https://github.com/danielnagy-dev/cro-sport-hub/issues/61) [19c], [#62](https://github.com/danielnagy-dev/cro-sport-hub/issues/62) [20a], [#63](https://github.com/danielnagy-dev/cro-sport-hub/issues/63) [24c], [#65](https://github.com/danielnagy-dev/cro-sport-hub/issues/65) [25a]. 8c, 19a, and 24b are already on main (GitHub #44, #45, #46, and #47).
- [#53](https://github.com/danielnagy-dev/cro-sport-hub/issues/53) [30c] and [#54](https://github.com/danielnagy-dev/cro-sport-hub/issues/54) [30d] wait on #52. [#55](https://github.com/danielnagy-dev/cro-sport-hub/issues/55) [30e] waits on #53 and #54. [#56](https://github.com/danielnagy-dev/cro-sport-hub/issues/56) [31a] waits on #53.
- [#58](https://github.com/danielnagy-dev/cro-sport-hub/issues/58) [9b] waits on #57. [#59](https://github.com/danielnagy-dev/cro-sport-hub/issues/59) [12b] waits on #58.
- [#64](https://github.com/danielnagy-dev/cro-sport-hub/issues/64) [24d] waits on #63. [#66](https://github.com/danielnagy-dev/cro-sport-hub/issues/66) [20b] waits on #60. [#67](https://github.com/danielnagy-dev/cro-sport-hub/issues/67) [25b] waits on #65 and #63. [#68](https://github.com/danielnagy-dev/cro-sport-hub/issues/68) [25c] waits on #67 and #64.
- [#69](https://github.com/danielnagy-dev/cro-sport-hub/issues/69) [26a] waits on #59, #64, and #68. [#70](https://github.com/danielnagy-dev/cro-sport-hub/issues/70) [26b] and [#71](https://github.com/danielnagy-dev/cro-sport-hub/issues/71) [27a] wait on #69. [#72](https://github.com/danielnagy-dev/cro-sport-hub/issues/72) [27b] and [#73](https://github.com/danielnagy-dev/cro-sport-hub/issues/73) [27c] wait on #71.
- [#74](https://github.com/danielnagy-dev/cro-sport-hub/issues/74) [31b] waits on #56, #54, #55, and #69.
- [#75](https://github.com/danielnagy-dev/cro-sport-hub/issues/75) [32] waits on every other open issue in this list.

Issue #50 has the same title as #51 and an empty body. Close #50. #51 is the spec.

## Parallel

One issue from each group may run with one issue from every other group. Issues in the same group run one at a time. Shared paths are the ones in the issue's Notes.

| Group  | One at a time                                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| API    | #51 [14b], #52 [30b], #53 [30c], #54 [30d], #55 [30e], #57 [9a], #58 [9b], #59 [12b]                                               |
| Web    | #60 [19b], #61 [19c], #62 [20a], #66 [20b]                                                                                         |
| Studio | #56 [31a], #63 [24c], #64 [24d], #65 [25a], #67 [25b], #68 [25c], #69 [26a], #70 [26b], #71 [27a], #72 [27b], #73 [27c], #74 [31b] |

Sport admin and user admin stay out of v1. They have no issue.
