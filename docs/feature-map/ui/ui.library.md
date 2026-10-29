# ui.library: Component stories

| App | Status | Entry point (user POV)                   | Verify             | Since                                           |
| --- | ------ | ---------------------------------------- | ------------------ | ----------------------------------------------- |
| ui  | live   | Storybook, port 6006, story Library/Base | `vp run verify:ui` | plan items for the UI library (formerly GH #36) |

Storybook shows the shared React components. Badge, SportTabs, and AthleteHeader are one story, `Library/Base` (`library--base`), not three stories. The athlete name on that story is the sample `Sample Athlete`.

#### Sub-features

- `ui.library-badge` shows Neutral, Tennis, and Football badges.
- `ui.library-tabs` shows the tennis and football tabs.
- `ui.library-athlete` shows the sample athlete header.

#### How to get to it (user POV)

- Open Storybook at `http://localhost:6006` and choose Library / Base.
- Open the story iframe `http://localhost:6006/iframe.html?id=library--base&viewMode=story`.

#### Driving it with verify

Preconditions: port 6006 is free. Playwright Chromium is installed.

- **Index and story.** Run `vp run verify:ui`. `GET /index.json` is `pass`, and the `Library/Base` row is `pass` with the text `Sample Athlete` visible. The screenshot is the proof.

#### Gotchas

- The story list comes from `/index.json` (`type: "story"`, at most 10). Adding a story does not require a code change in the driver; the new story is included on the next run. A story whose id is `library--base` must still show `Sample Athlete`.
- Do not point this check at a production build of Storybook unless you pass `--url`.
