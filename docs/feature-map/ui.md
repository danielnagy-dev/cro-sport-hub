# UI

Entries for the UI library. Shared preconditions and driving conventions are in `docs/feature-map.md`.

## Index

| ID         | Feature                                            | App | Status | Entry point (user POV)                   | Verify             | Since                                           |
| ---------- | -------------------------------------------------- | --- | ------ | ---------------------------------------- | ------------------ | ----------------------------------------------- |
| ui.library | Component stories: Badge, SportTabs, AthleteHeader | ui  | live   | Storybook, port 6006, story Library/Base | `vp run verify:ui` | plan items for the UI library (formerly GH #36) |
| ui.results | Scores, stats, and appearances                     | ui  | live   | Storybook, port 6006, Results stories    | `vp run verify:ui` | plan item 16                                    |

Planned paths are estimates. The change that builds each feature updates its row.

## Feature entries

### ui.library: Component stories

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

### ui.results: Match scores, tennis stats, and appearances

Storybook shows a tennis set scoreboard, a retirement, a football score, serve and return percentages, and an appearances table. Names are samples. `Library/Base` is unchanged. The web home renders `MatchCard`. Stats and appearances stay in Storybook.

#### Sub-features

- `ui.results-tennis` shows Sample Player A, set columns, Winner, and the loser's tiebreak on the 7-6 set.
- `ui.results-retired` shows Retired and does not show Winner.
- `ui.results-football` shows Sample Home, Sample Away, and the goals. It does not name a winner.
- `ui.results-tennis-stats` shows Sample Player, 60% and 66.7% from the counts, and No attempts when a denominator is zero. A real zero rate stays 0%.
- `ui.results-appearances` shows Sample Cup, the match date and round, minutes, goals, assists, and cards, including Second yellow.

#### How to get to it (user POV)

- Open Storybook at `http://localhost:6006` and choose a Results story.
- Direct iframes: `results--tennis-score`, `results--retired`, `results--football-score`, `results-tennis-stats--percentages`, `results-appearances--table`.

#### Driving it with verify

Preconditions: same as `ui.library`.

- **Stories.** Run `vp run verify:ui`. The score rows stay `pass` with `Sample Player A`, `Retired`, and `Sample Home`. Tennis stats is `pass` with `66.7%`. Appearances is `pass` with `Second yellow`.

#### Gotchas

- The tiebreak figure is the loser's points. It is announced with that player. The superscript is hidden from assistive tech so the number is not read twice.
- Football scores do not name a winner, including a 2-0.
- A tennis percentage is No attempts when its denominator is 0. That is a different cell from 0%.
- The home page renders `MatchCard` for each published result. The stats view and the appearances table stay in the library.
