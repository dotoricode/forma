# Design grammar

Forma has one shared foundation and four artifacts. An artifact decides
both the information structure and its visual composition; `variant` picks
a recipe inside it.

- `dashboard` (Signal Grid): dense, numeric, state-first. No long cover.
- `report` (Editorial Brief): strong typography, conclusion up front.
- `manual` (Guided Path): navigation-first, narrow measure, steps with
  expected results.
- `advanced` (Decision Room): interactive evidence, simulation, and a
  recorded decision.

These are not four CSS skins over one DOM. That was the 0.1 `designSystem`
field, and it could not make a dashboard answer "what changed and where is
the problem" while a manual answers "what do I do, in what order".

All artifacts share the following rules:

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
