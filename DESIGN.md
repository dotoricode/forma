# DESIGN.md — Forma's design system

Single source of truth for Forma's visual language. Every Rendered Output
shares the same semantic tokens, accessibility rules, and offline
guarantees, then belongs to one of four artifacts: `dashboard`, `report`,
`manual`, or `advanced`. See `docs/design-research-2026.md` for the research
and naming rationale, and `skills/forma/references/artifacts.md` for each
artifact's composition contract.

## Design intent

Refined, purposeful, legible, and visibly authored. Theme differences come
from composition, rhythm, and typography rather than ornamental effects.
Explicitly not a SaaS landing page or a generic AI-tool demo.
See `skills/forma/references/generic-ai-patterns.md` for the exhaustive
banned-pattern list — none of it appears here by construction.

## Tokens

Defined in `src/design/tokens.ts` (primitives) and emitted in
`src/design/foundations-css.ts` (`@layer tokens`). Block styles live in
`block-css.ts` and per-artifact overrides in `artifact-css.ts`. Semantic names only — component CSS
never references a primitive or raw hex/OKLCH value directly.

- **Color**: `--color-canvas/surface/surface-raised/text/text-muted/
  border/border-strong/accent/accent-strong/on-accent/success/warning/
  danger/info`. All OKLCH. One accent hue (restrained ink-blue). At most 3
  surface levels in either theme.
- **Typography**: `--font-sans` (Geist → IBM Plex Sans KR → system-ui),
  `--font-mono` (Geist Mono → system mono). `--measure-prose` (42rem),
  `--measure-wide` (`min(100%, 64rem)`). These are rem, not ch: `ch` is the
  advance width of "0", so it rescales with each block's own font-size and
  fits roughly half as much Korean per line. `src/qa/design-lint.ts` rejects
  ch-based measures.
- **Spacing**: `--space-1`…`--space-9`, an 8px-rooted scale.
- **Radius**: `--radius-sm/md/lg` — small, functional rounding only, never
  a decorative "everything is a pill" default.
- **Motion**: `--motion-fast/base/slow` (120/180/240ms),
  `--ease-standard`. `prefers-reduced-motion: reduce` strips all of it.

## Layout grammar

- Prose measure `--measure-prose` (`.measure`). Only code, tables, and
  diagrams use `.breakout`. Width caps never centre: `margin-inline` stays
  `0` so every block shares one left baseline.
- Section headings are, where the content supports it, complete claims
  ("The change resets connection state explicitly") rather than bare
  labels ("Overview") — this is a content decision the Agent Skill makes,
  not something the renderer enforces.
- `@layer reset, tokens, base, layout, components, utilities, overrides` —
  strict cascade order, no specificity wars, no `!important` outside the
  print stylesheet's necessary overrides.
- Container queries size the comparison two-column grid
  (`@container (min-width: 720px)`); logical properties
  (`margin-inline`, `border-block-end`, …) throughout; CSS Subgrid is used
  for the test-matrix table behind `@supports (grid-template-rows:
  subgrid)` with a working non-subgrid fallback.

## What's explicitly banned

See `skills/forma/references/generic-ai-patterns.md` for the full list;
the two most important structural rules:

0. **Blocks are TSX components** (`src/blocks/*.tsx`), compiled to HTML with
   `renderToStaticMarkup`. React is a build-time dependency only: the
   shipped page contains no hydration markers and no runtime, and a test
   asserts it. The version is pinned exactly, because escaping and
   attribute serialization are part of the output.
1. **No left-side bracket/hook borders.** Note rails use a plain
   `border-inline-start: 1px solid` on the element itself — never a
   `::before`/`::after` pseudo-element combining a left border with a
   top/bottom border or hook. `src/qa/design-lint.ts` checks this
   automatically.
2. **No decorative oversized brackets.** No `content: "["`, `content:
   "{"`, `content: "</>"` anywhere. Also lint-checked.

## Artifacts

| Artifact | Direction | Composition |
|---|---|---|
| `dashboard` | Signal Grid | Dense numeric grid, state first, no long cover |
| `report` | Editorial Brief | Conclusion up front, editorial rules, print-aware |
| `manual` | Guided Path | Orientation rail, narrow measure, steps with results |
| `advanced` | Decision Room | Evidence graph, simulation, recorded decision |

The stylesheet hooks are `data-artifact` and `data-variant` on `<html>`,
kept separate so a rule can address every report without repeating itself
per variant.

An artifact is not a CSS skin. The 0.1 `designSystem` field was, and that
was the limitation: four looks over one identical DOM could not give a
dashboard and a manual different information structures. Composition
contracts live in `src/planner/profiles/` and are enforced at validation.

Legacy 0.1 identifiers migrate at the schema boundary
(`src/spec/migrations.ts`) and render under a legacy-compatible path that
is exempt from the contract, with warnings naming the gaps.

## Composition contract

`src/planner/plan.ts` resolves each block onto the semantic roles it can
fill, then checks the artifact's profile against the result. This is what
the 0.1 `mode` field was supposed to be: `mode` was recorded in the
manifest and changed nothing, so `mode: "report"` guaranteed no
report-shaped output.

## Dark mode

Driven by `[data-theme="dark"]` (explicit, via the theme-toggle island) or
`prefers-color-scheme: dark` (implicit, when no explicit choice has been
made). Print is always forced to a light, ink-on-white presentation
regardless of the active theme.

## Iteration record

See `docs/design-iterations.md` for the concrete before/after changes made
during the two required refinement passes on the four fixtures.
