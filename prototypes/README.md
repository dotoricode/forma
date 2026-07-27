# Design prototypes

**Open [`gallery.html`](./gallery.html)** for a clickable 4-mode × 3-direction
comparison grid (12 pages total).

Three directions, each rendered against all four modes' real content
(explain/review/test/report) — not color variants of the same layout, but
genuinely different information architecture. Built to compare before
committing to one design language for Forma. See `docs/design-audit.md`
for the full research behind each direction and `DESIGN.md` for the
chosen system.

- **`quiet-editorial/`** — the actual renderer output (these are Forma's
  real fixtures, run through the same spec → renderer → QA pipeline as
  everything else in the repo). Prose-width narrative, a note rail, wide
  breakout for code/diagrams, minimal chrome. **Selected direction.**
- **`precision-workbench/`** — denser, sticky status bar, two-column
  panels, KPI row up top. More "dashboard-like." Hand-built static mockups
  (not the real renderer) — for comparison only.
- **`technical-manuscript/`** — serif, numbered clauses, footnote-style
  citations. Reads like a spec document/RFC. Hand-built static mockups
  (not the real renderer) — for comparison only.

Each direction has one file per mode: `explain.html`, `review.html`,
`test.html`, `report.html`.

## Outcome

Quiet Editorial was selected: it reads calmly at prose width, still lets
code/diagrams breathe at full width, and doesn't force every mode into a
dashboard or a legal-document register — the two qualities the other two
directions traded off against each other. Precision Workbench's density
works for `review`/`test` but feels cramped for `explain`/`report`;
Technical Manuscript's numbered-clause structure fits neither test results
nor executive reports well. Quiet Editorial's plain prose-first grammar
adapts to all four modes through composition alone, which is what made it
the one system worth building the full token/block library around.
