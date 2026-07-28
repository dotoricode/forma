# Block selection

Twenty semantic blocks. Pick the one that matches the *meaning* of the
content, not whatever looks convenient.

| Block | Use for |
|---|---|
| `cover` | Document title, mode, audience meta — always first |
| `summary` | The one-paragraph "what this is" |
| `prose` | Long-form explanation that doesn't fit a more specific block |
| `key-points` | A short numbered list of the most important facts |
| `annotated-code` | A code excerpt with line highlights and side notes |
| `diff` | A unified diff, rendered with real old/new line numbers |
| `flow` | A step-by-step process with branching/decisions |
| `sequence` | Interactions between named participants over time |
| `timeline` | Dated or ordered events |
| `comparison` | Two-sided before/after or option-A/option-B |
| `architecture` | Components and their relationships, grouped |
| `test-summary` | Pass/fail/skip counts at a glance |
| `test-matrix` | Per-environment or per-case pass/fail grid |
| `chart` | A small bar/line chart of numeric data |
| `finding` | A single observation with a severity |
| `risk` | Likelihood × impact plus a mitigation |
| `decision` | A decision strip: status + rationale |
| `actions` | A checklist of next steps with owners/dates |
| `glossary` | Term definitions |
| `source-note` | Just a citation list, no other content |

Every block accepts `sourceRefs` (ids into `sources[]`) and `confidence`
(`verified | inferred | unknown`). Set these honestly — see
`source-handling.md`.
