# Issue tracker: GitHub

Issues and PRDs for this repository live in GitHub Issues for
`dotoricode/forma`. Use the `gh` CLI for issue operations.

## Conventions

- Create: `gh issue create --title "..." --body "..."`
- Read: `gh issue view <number> --comments`
- List: `gh issue list --state open`
- Comment: `gh issue comment <number> --body "..."`
- Add or remove labels: `gh issue edit <number> --add-label "..."` or
  `gh issue edit <number> --remove-label "..."`
- Close: `gh issue close <number> --comment "..."`

Infer the repository from the current clone's Git remote.

When a skill says to publish to the issue tracker, create a GitHub issue.
When it says to fetch a relevant ticket, use `gh issue view`.
