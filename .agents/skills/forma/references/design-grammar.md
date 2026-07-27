# Design grammar — Quiet Editorial

Forma's one design language, chosen after three prototypes were compared
(`prototypes/`, `docs/design-audit.md`). All four modes share the same
tokens and typography; only composition changes.

- Prose measure is 66–72ch. Only code, tables, and diagrams break out wider.
- Heading hierarchy comes from weight + measure + line-height + space, not
  from size alone.
- Section headings, where possible, are complete claims ("The change
  resets connection state explicitly"), not labels ("Overview").
- Borders only ever fully frame a breakout element (code, table, diagram).
  Never a left-only bracket, hook, or partial frame.
- A note rail (thin `border-inline-start`, muted text) is the only
  side-margin annotation pattern — no decorative verticals elsewhere.
- One accent color. Status colors (success/warning/danger/info) are used
  only when they carry real meaning (test pass/fail, risk level).
- At most 3 surface levels (canvas / surface / raised) in either theme.
- You do not choose colors, radii, or shadows per document — those come
  from the renderer's design tokens. You choose blocks and content.
