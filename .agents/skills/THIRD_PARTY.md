# Third-party skills

Vendored from [mattpocock/skills](https://github.com/mattpocock/skills) at `5beb35b040e3de97e54fa9e386d7e42d15c295c2`. License: MIT, text in `LICENSE-mattpocock-skills` ("Copyright (c) 2026 Matt Pocock"). Do not edit the skill folders by hand.

| Skill              | Upstream path                          | Source                               | Commit                                   | License                         |
| ------------------ | -------------------------------------- | ------------------------------------ | ---------------------------------------- | ------------------------------- |
| tdd                | skills/engineering/tdd                 | https://github.com/mattpocock/skills | 5beb35b040e3de97e54fa9e386d7e42d15c295c2 | MIT (LICENSE-mattpocock-skills) |
| diagnosing-bugs    | skills/engineering/diagnosing-bugs     | https://github.com/mattpocock/skills | 5beb35b040e3de97e54fa9e386d7e42d15c295c2 | MIT (LICENSE-mattpocock-skills) |
| codebase-design    | skills/engineering/codebase-design     | https://github.com/mattpocock/skills | 5beb35b040e3de97e54fa9e386d7e42d15c295c2 | MIT (LICENSE-mattpocock-skills) |
| grilling           | skills/productivity/grilling           | https://github.com/mattpocock/skills | 5beb35b040e3de97e54fa9e386d7e42d15c295c2 | MIT (LICENSE-mattpocock-skills) |
| grill-me           | skills/productivity/grill-me           | https://github.com/mattpocock/skills | 5beb35b040e3de97e54fa9e386d7e42d15c295c2 | MIT (LICENSE-mattpocock-skills) |
| code-review        | skills/engineering/code-review         | https://github.com/mattpocock/skills | 5beb35b040e3de97e54fa9e386d7e42d15c295c2 | MIT (LICENSE-mattpocock-skills) |
| writing-for-agents | skills/productivity/writing-for-agents | https://github.com/mattpocock/skills | 5beb35b040e3de97e54fa9e386d7e42d15c295c2 | MIT (LICENSE-mattpocock-skills) |

Installed with:

```bash
DISABLE_TELEMETRY=1 npx -y skills@1.7.4 add "https://github.com/mattpocock/skills/tree/5beb35b040e3de97e54fa9e386d7e42d15c295c2" -a cursor --copy -y --skill tdd --skill diagnosing-bugs --skill codebase-design --skill grilling --skill grill-me --skill code-review --skill writing-for-agents
```

npm 11 will not start `npx` in this repo, because `package.json` `devEngines.packageManager` requires pnpm. Move `package.json` aside, run the command from the repository root, then restore the file.

## Update

A bump is its own pull request. `npx skills update` (alias `check`) reads the `ref` in `skills-lock.json` and does not move a full SHA forward.

1. In a clone of the upstream repo, diff `OLD..NEW` for `skills/engineering/{tdd,diagnosing-bugs,codebase-design,code-review}` and `skills/productivity/{grilling,grill-me,writing-for-agents}`.
2. Read that diff for instructions to merge, push, post, call `gh`, or use the network.
3. Re-run the install command with the new SHA.
4. Update the commit column and the command in this file.
5. Open one pull request for the bump.

On conflict, `AGENTS.md`, `docs/team.md`, and `.cursor/skills/` win over `.agents/skills/`.

---

Vendored from [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance) at `64a6d708f5a43f2cd3fde5d4d7db3905ba1bdf65` (release v1.0.1; skill corpus `2026_11_10-47b4c80e` in `SKILL.md`). License: Apache-2.0, text in `LICENSE-modern-web-guidance`. Do not edit the skill folder by hand.

| Skill               | Upstream path              | Source                                              | Commit                                   | License                                  |
| ------------------- | -------------------------- | --------------------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| modern-web-guidance | skills/modern-web-guidance | https://github.com/GoogleChrome/modern-web-guidance | 64a6d708f5a43f2cd3fde5d4d7db3905ba1bdf65 | Apache-2.0 (LICENSE-modern-web-guidance) |

Installed with:

```bash
DISABLE_TELEMETRY=1 npx -y skills@1.7.4 add "https://github.com/GoogleChrome/modern-web-guidance/tree/64a6d708f5a43f2cd3fde5d4d7db3905ba1bdf65" -a cursor --copy -y --skill modern-web-guidance
```

npm 11 will not start `npx` in this repo, because `package.json` `devEngines.packageManager` requires pnpm. Move `package.json` aside, run the command from the repository root, then restore the file.

## Update (modern-web-guidance)

A bump is its own pull request.

1. Note the new upstream release tag and full commit SHA; read `SKILL.md` for the current `--skill-version` string agents must pass to `search`.
2. Re-run the install command with the new SHA.
3. Update this table, the install command, and `LICENSE-modern-web-guidance` if the upstream license changed.
4. Update `.cursor/rules/modern-web-guidance.mdc` and `AGENTS.md` if the `--skill-version` value changed.
5. Open one pull request for the bump.
