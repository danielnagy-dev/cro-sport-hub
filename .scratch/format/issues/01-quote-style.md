# fmt: Single quotes, no semicolons

**What to build:** One format pass so the tree uses single quotes, no semicolons, and trailing commas wherever the formatter prints them. Nothing else changes.

**Blocked by:** Every open pull request. Start only when the forge shows none. A pull request that opens while this branch exists is merged from `origin/main` before the final push, and the format is run again on the files that merge added.

**Status:** in-review

**Size:** The whole tree. Counted lines pass 400. This stays one pull request: the plan skill's one-shot format exception. Splitting it would leave two quote styles in the tree.

**Shared files:**

- `vite.config.ts`
- every file the formatter rewrites

This ticket runs alone.

## Scope

In: the root `fmt` object in `vite.config.ts`, which is the oxfmt config `vp fmt` already reads. Set `semi: false`, `singleQuote: true`, and `trailingComma: "all"`. Then run `vp fmt` once and commit the result.

Checked on 26 Oct 2026 against oxfmt 0.74.0 (the lockfile copy) and the root `vite.config.ts`:

- `fmt` sets `ignorePatterns` only. It does not set quotes, semicolons, or trailing commas, so oxfmt's defaults apply.
- Those defaults are `semi: true`, `singleQuote: false`, and `trailingComma: "all"`. The tree matches them: double quotes, semicolons, and trailing commas in multi-line TypeScript.
- `singleQuote` also covers Markdown, CSS, and YAML. Those rewrites stay in this pull request.
- `jsxSingleQuote` stays at its default `false`. JSX attribute quotes stay double. `singleQuote` is the switch for JavaScript and TypeScript string quotes.
- Oxlint, in the same `vite.config.ts`, does not set a quotes, semicolon, or trailing-comma rule. `lint.rules` is the correctness and type-aware set. This pull request does not add a lint rule, a second config file, or an `.oxfmtrc`.

Trailing commas are already the default, so this pass should add few of them. A trailing comma keeps the previous line out of a diff when a later edit adds an item. It does not stop two pull requests that append at the same spot from conflicting.

Out: feature work, import sorting (`sortImports` stays off), oxlint rule changes, and any hand edit of a formatted file.

## Order

Plan is this note. No architect step: the formatter is dev tooling and the runtime graph is unchanged. Develop, then the author self-reviews. Daniel squash-merges. This ticket is outside the v1 README's "every other ready ticket" set.

## Acceptance

- [ ] `vp run format-check` passes with `semi: false`, `singleQuote: true`, and `trailingComma: "all"` set on the root `fmt` object.
- [ ] A TypeScript file in the diff uses single quotes and omits semicolons.
- [ ] The diff contains no behaviour change. A reviewer can see that from the formatted hunks.

## Verification

`not applicable (no runtime change)` for the product. The bytes of app and library source do change, so the author also runs `typecheck`, `test`, `build`, and `vp run verify:api`, `verify:studio`, `verify:web`, and `verify:ui` once. No new feature-map id.

## Architect

No. No new module, shared type, or dependency.

### Seams

- `vp run format-check`. Catches a file the config did not reach, including a Markdown file `singleQuote` rewrote and someone reverted.
