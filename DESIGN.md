# DESIGN.md — Forma's design system

Single source of truth for Forma's visual language. Every Rendered Output
shares the same semantic tokens, accessibility rules, block markup, and
offline guarantees, then chooses one of four understandable themes:
`simple`, `workspace`, `guide`, or `magazine`. See
`docs/design-research-2026.md` for the research and naming rationale.

## Design intent

Refined, purposeful, legible, and visibly authored. Theme differences come
from composition, rhythm, and typography rather than ornamental effects.
Explicitly not a SaaS landing page or a generic AI-tool demo.
See `skills/forma/references/generic-ai-patterns.md` for the exhaustive
banned-pattern list — none of it appears here by construction.

## Tokens

Defined in `src/design/tokens.ts` (primitives) and emitted in
`src/design/css.ts` (`@layer tokens`). Semantic names only — component CSS
never references a primitive or raw hex/OKLCH value directly.

- **Color**: `--color-canvas/surface/surface-raised/text/text-muted/
  border/border-strong/accent/accent-strong/on-accent/success/warning/
  danger/info`. All OKLCH. One accent hue (restrained ink-blue). At most 3
  surface levels in either theme.
- **Typography**: `--font-sans` (Geist → IBM Plex Sans KR → system-ui),
  `--font-mono` (Geist Mono → system mono). `--measure-prose` (70ch),
  `--measure-wide` (96ch cap for the whole document).
- **Spacing**: `--space-1`…`--space-9`, an 8px-rooted scale.
- **Radius**: `--radius-sm/md/lg` — small, functional rounding only, never
  a decorative "everything is a pill" default.
- **Motion**: `--motion-fast/base/slow` (120/180/240ms),
  `--ease-standard`. `prefers-reduced-motion: reduce` strips all of it.

## Layout grammar

- Prose measure 66–72ch (`.measure`). Only code, tables, and diagrams use
  `.breakout` (up to `--measure-wide`).
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

1. **No left-side bracket/hook borders.** Note rails use a plain
   `border-inline-start: 1px solid` on the element itself — never a
   `::before`/`::after` pseudo-element combining a left border with a
   top/bottom border or hook. `src/qa/design-lint.ts` checks this
   automatically.
2. **No decorative oversized brackets.** No `content: "["`, `content:
   "{"`, `content: "</>"` anywhere. Also lint-checked.

## Themes

| Theme | Best for | Composition |
|---|---|---|
| `simple` | Mixed-audience documents | Strong opening rule, stable reading edge, generous pauses |
| `workspace` | Dense technical review and test evidence | Persistent tool rail, compact rhythm, raised evidence only |
| `guide` | Manuals and step-by-step explanations | Orientation-first rail, narrow measure, prominent callouts |
| `magazine` | Narrative reports and long-form explainers | Display serif, asymmetric cover, editorial rules |

Legacy identifiers remain accepted at the schema boundary and normalize to
these names. New specs and documentation only use the four names above.

## Mode composition

| Mode | Emphasis |
|---|---|
| `explain` | Narrative first, diagram/code close together, glossary at the end |
| `review` | Decision-relevant material up front: comparison, diff, risk, test evidence, decision strip |
| `test` | Result band → matrix → chart → failure evidence → limitations/actions |
| `report` | Executive summary → timeline/findings → options → decision → actions |
| `manual` | Outcome → prerequisites → procedure → checkpoints → troubleshooting → verification |

All five render through the same `src/design/css.ts` stylesheet and the
same 20 block renderers in `src/renderer/blocks.ts` — there is no
per-mode CSS file or theme swap beyond `data-density` and `data-theme`.

## Dark mode

Driven by `[data-theme="dark"]` (explicit, via the theme-toggle island) or
`prefers-color-scheme: dark` (implicit, when no explicit choice has been
made). Print is always forced to a light, ink-on-white presentation
regardless of the active theme.

## Iteration record

See `docs/design-iterations.md` for the concrete before/after changes made
during the two required refinement passes on the four fixtures.
