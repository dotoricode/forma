# Design iterations

Record of the required refinement passes: functional-first render → look
at real screenshots at all four viewports and in dark mode → fix →
re-render → re-check. Two rounds performed against the four fixtures.

## Round 1 — after the first fully-working render

Found by reading actual Playwright screenshots (not just "it rendered"):

1. **Flow-diagram terminal nodes were unreadable.** `start`/`end` nodes in
   `flow` diagrams (e.g. "initialize() 호출", "정책 캐시 갱신" in the
   `explain` fixture) rendered as solid dark boxes with **invisible**
   text. Cause: the inline SVG `fill="..."` presentation attribute on
   `<text>` was silently overridden by the later, higher-priority CSS rule
   `.blk-diagram svg text { fill: var(--color-text); }` — same dark color
   as the node's own fill. Fixed by giving inverted-text nodes a real CSS
   class (`diagram-node-label--invert`) with higher selector specificity
   instead of relying on a presentation attribute.
2. **Container queries never activated.** The comparison block's
   two-column grid and the annotated-code note-rail (`@container
   (min-width: …)`) silently never triggered at any viewport width,
   because no ancestor had `container-type` set — an `@container` query
   with no containment context just never matches. Fixed by adding
   `container-type: inline-size` to `.section`. Confirmed after the fix:
   the two-column comparison layout and the side note-rail both now
   appear on wide viewports (see `fixtures/report/output/qa/desktop-1440.png`
   and `fixtures/explain/output/qa/desktop-1440.png`).
3. **Code-copy button rendered as a full-width bar, not a corner button.**
   `float: inline-end` has no effect on a grid item (`.blk-code__frame` is
   `display: grid`), so the button occupied the full first grid cell.
   Fixed by switching to `position: absolute` inside a
   `position: relative` frame.
4. **Invalid SVG attribute caused a console error.** `height="auto"` is
   not a valid SVG length and Chromium logged
   `Error: <svg> attribute height: Expected length, "auto".` on every
   fixture with a diagram/chart. Fixed by removing the width/height
   attributes from the `<svg>` element entirely and controlling sizing
   purely through CSS (`width: 100%; height: auto;` is valid as a CSS
   declaration, just not as an SVG attribute value).
5. **A "0 failed" stat rendered in alarm-red.** `test-summary`'s failed
   count used its red "fail" tone even when the value was 0 (see the
   `review` fixture, which has 0 failures). Fixed so the tone only applies
   when the count is actually nonzero — zero shouldn't look like an
   alert.

## Round 2 — accessibility + list markers

Driven by `pnpm qa`'s axe-core output (not just visual read):

1. **`heading-order` violation** — the `comparison` block's column labels
   used `<h4>` directly after the block's own `<h2>` title, skipping `<h3>`.
   Fixed by using `<h3>`.
2. **`color-contrast` violation** — the `unconfirmed`/`unknown` confidence
   tag used `var(--color-warning)` directly as text color on the canvas
   background (2.41:1, needs 4.5:1). Fixed by keeping the text at normal
   ink contrast and moving the warning color to the tag's border/background
   tint instead — same signal, readable text.
3. **`empty-table-header` violation** — the test-matrix's corner header
   cell used `&nbsp;` as its only content, which axe doesn't count as text
   visible to screen readers. Fixed with a real (visually-hidden) label.
4. **Double list markers.** Several lists (`takeaways`, `key-points`,
   `comparison` columns, `actions`, `source-note`) never explicitly reset
   `list-style`, so the browser's native marker (disc bullets, or — for
   `key-points`, which already draws its own numbered counter via
   `::before` — a *second*, redundant decimal number) rendered alongside
   Forma's own divider-based list styling. Fixed by adding `list-style:
   none` everywhere a list uses dividers/counters instead of native
   markers. Confirmed by re-checking computed styles
   (`getComputedStyle(li).listStyleType`) before and after.

## What round 2 confirmed already worked

All four fixtures: 0 console errors, 0 external network requests, 0 axe
violations, correct heading order, dark mode via the `data-theme`
attribute (verified by forcing it directly rather than relying on
`prefers-color-scheme`, since fixtures set an explicit light theme that
intentionally overrides OS preference).

## Still worth a third pass (not blocking, noted for follow-up)

- The diff view's two line-number columns (old/new) could use a touch
  more visual separation at narrow widths — functional, not broken.
- Table-of-contents wrapping on `mobile-390` gets dense on
  section-heavy fixtures (`test`); still fully usable, just not
  especially elegant.
