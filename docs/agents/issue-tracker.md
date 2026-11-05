# Issue tracker: Local Markdown

Source: [mattpocock/skills](https://github.com/mattpocock/skills) `skills/engineering/setup-matt-pocock-skills/issue-tracker-local.md` at `5beb35b040e3de97e54fa9e386d7e42d15c295c2`.

Issues and specs for this repo live as markdown files in `.scratch/`. `.scratch/` is not gitignored. Commit the ticket files.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

`triage` is not installed, so this repo has no `docs/agents/triage-labels.md`. The status strings in use are the ones this convention already names: `ready-for-agent`, `claimed`, and `resolved`.

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed). One ticket per file. Do not add a ticket list or a status table to this index.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

Origin has no GitHub or GitLab issues. A `#123` in a commit is not an issue id. Do not call `gh` or `glab`. Do not create labels, issues, or comments on a remote. Read the ticket file, or the PR `## Summary` when the file is not in the branch. Status on a ticket is plan-item status, not a remote issue.

GitHub issue forms in `.github/ISSUE_TEMPLATE/` use the same fields (goal, acceptance criteria, blocked by, size) for people filing on GitHub. Agents still write the local ticket and do not open a GitHub issue.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.

`wayfinder` is not installed. Do not create `map.md` for ordinary plan items.

## This repo

Daniel's plan id is the ticket's `NN`, including a letter suffix such as `4b`. Do not renumber an existing plan id from `01`. Those ids are already cited (for example plan item 16 in `docs/feature-map/ui.md`). A new split that has no plan id yet is numbered from `01` inside its feature directory, as above.

A feature with no separate spec keeps that text in the ticket file. Do not copy it into an empty `spec.md`.

A pull request writes only its own ticket file. It leaves every other file under `.scratch/` unchanged, and it leaves this index without a ticket list.

`**Status:**` is `ready-for-agent` when the note is written and work has not started, `claimed` while the branch or the pull request is in progress, and `resolved` on the pull request that finishes the item. The merge puts `resolved` on `main`. The pull request link goes under `## Comments`.

PRs live on Cursor Origin. Who reviews is the phase in `docs/team.md`. Agents never merge. Daniel squash-merges. That merge is the final gate.

Before the final push, fetch and merge the latest `origin/main` as `AGENTS.md` describes.
