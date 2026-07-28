# Design grammar

Forma has one shared foundation and four purpose-led themes. Modes decide
the story; themes decide its visual composition.

- `simple`: calm reading for explanations and short reports.
- `workspace`: compact tool rail and raised evidence for reviews and tests.
- `guide`: persistent orientation and narrow reading measure for manuals.
- `magazine`: strong display hierarchy and asymmetric rhythm for narrative
  reports. Use it only when the content supports a deliberate editorial pace.

All themes share the following rules:

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
- Establish one primary focal point, then a secondary reading path and a
  clear continuation. Grid breaks are allowed only when they strengthen
  that path.
- Treat spacing as timing: related items cluster, transitions breathe, and
  section rhythm remains legible at desktop and mobile widths.
