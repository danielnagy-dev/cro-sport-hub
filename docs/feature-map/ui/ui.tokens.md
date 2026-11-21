# ui.tokens: Design tokens and variant contract

| App | Status | Entry point (user POV)                      | Verify             | Since   |
| --- | ------ | ------------------------------------------- | ------------------ | ------- |
| ui  | live   | Storybook, port 6006, story Tokens/Swatches | `vp run verify:ui` | GH #167 |

Storybook shows the shared CSS token layer and the documented `data-*` variant contract. The story id is `tokens--swatches`. Visible proof text is `Kit tokens`.

#### Sub-features

- `ui.tokens-swatches` shows colour token chips (including basketball).
- `ui.tokens-variants` shows `data-tone`, `data-size`, `data-variant`, and `data-status` samples.

#### How to get to it (user POV)

- Open Storybook at `http://localhost:6006` and choose Tokens / Swatches.
- Open the story iframe `http://localhost:6006/iframe.html?id=tokens--swatches&viewMode=story`.

#### Driving it with verify

Preconditions: port 6006 is free. Playwright Chromium is installed.

- **Index and story.** Run `vp run verify:ui`. `GET /index.json` is `pass`, and the `Tokens/Swatches` row is `pass` with the text `Kit tokens` visible. The screenshot is the proof.

#### Gotchas

- Consumers import `@cro-sport-hub/ui/tokens.css`. Studio does not need React to use tokens.
- Basketball is a token accent only here; `SportSlug` still lands with schema work.
