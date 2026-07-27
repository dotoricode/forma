# Design audit

Research done before committing to Forma's design language, per the build
instructions' requirement to study public principles rather than clone a
specific product's screens.

## References studied

- **Apple Human Interface Guidelines** — clarity, deference, depth; the
  idea that chrome should recede and content should lead. Adopted:
  restrained chrome, content-led hierarchy. Not adopted: Apple's specific
  blur/vibrancy materials, SF Pro, or rounded-corner conventions verbatim.
- **Microsoft Fluent 2** — platform-adaptive layout, a layered token
  system (global → alias → component), focus on inclusive contrast.
  Adopted: the three-tier token structure (primitive → semantic →
  component-as-needed). Not adopted: Fluent's acrylic/reveal effects or
  Segoe UI.
- **WCAG 2.2** — contrast minimums, reflow at 400% zoom, target size,
  focus visibility. Used as a hard constraint throughout, verified with
  axe-core rather than just referenced.
- **Web Platform Baseline** — Widely Available vs Newly Available as the
  gate for which CSS features are safe to use unconditionally vs. behind
  `@supports`. Subgrid is the one Newly Available feature used, gated.
- **getdesign.md-style breakdowns of Linear/Notion/Mintlify/GitBook/Vercel**
  — used only to extract *principles* (information density choices,
  measure/line-length discipline, how they handle code blocks and tables),
  never to copy a specific screen. None of Forma's components are a
  reskin of any one of these products.
- Technical documentation, code-review tools, and data-journalism
  layouts — the actual reference class for Forma's problem (dense,
  evidence-heavy, decision-oriented reading), more than SaaS marketing
  sites.

## What we deliberately did not adopt

- Apple/Fluent's heavier visual materials (blur, acrylic, vibrancy,
  deep shadow elevation) — Forma's surfaces stay flat; elevation is
  communicated with a 1px border, not a shadow.
- Any specific brand's rounded-corner radius scale, spacing scale, or
  color ramp verbatim — Forma's OKLCH ramp and 8px spacing scale were
  built from scratch (`src/design/tokens.ts`).
- Dashboard-style KPI-tiles-up-top for non-dashboard content (test/report
  modes lead with narrative + the actual result band, not four disconnected
  stat tiles).

## Typography comparison

Rendered the same content set (Korean prose, English prose, mixed-language
headings, digits/tabular data, a code table across Kotlin/Java/C/JSON/
Bash, long identifiers, small caption text) across the candidate stack
before committing:

| Candidate | Verdict |
|---|---|
| Geist (sans) | Clean, neutral, good x-height, pairs well with IBM Plex Sans KR without a visible "seam" at the Latin/Hangul boundary in mixed headings. **Chosen.** |
| Instrument Sans / Manrope / DM Sans / Plus Jakarta Sans | All reasonable alternates; none paired as cleanly with IBM Plex Sans KR's stroke weight at heading sizes in side-by-side comparison. Kept as documented alternates, not used. |
| IBM Plex Sans KR (Hangul fallback) | Only realistic option researched with a matching OFL license, an official static-weight distribution (Regular/Bold — what Forma actually subsets), and legible Hangul at both body and heading sizes. **Chosen.** |
| Geist Mono (code) | Even digit width, clear `l/1/I` and `0/O` disambiguation, good density for annotated diffs. **Chosen.** |
| IBM Plex Mono / JetBrains Mono | Both fine alternates; Geist Mono was chosen for closer visual pairing with Geist Sans (shared design language) since Forma already commits to Geist for the sans face. |

Long Korean titles and long English identifiers were checked directly in
the four rendered fixtures (see `docs/design-iterations.md`) rather than
in isolation — `annotated-code` line wrapping and `cover` title wrapping
were the two places long content actually stressed the layout.

## Light/dark strategy

Three surface levels max in either theme (`canvas` / `surface` /
`surface-raised`). Explicit `meta.theme` always wins over
`prefers-color-scheme` — a document author's declared intent shouldn't be
silently overridden by the reader's OS setting. `theme: "auto"` is the one
case where OS preference applies. Print always forces light regardless of
theme, since printed output assumes ink-on-paper.

## Brand-clone risk

No logos, no proprietary icon sets, no distinctive component signatures
(e.g. Linear's specific issue-row layout, Notion's specific block-drag
handle) were reproduced. The one deliberately-avoided category is
"anything that reads as a screenshot of an existing product" — Forma's
layouts are generic enough that a reader shouldn't be able to name a
specific SaaS tool it resembles.

## Newly Available CSS feature audit

| Feature | Baseline status (as researched) | Forma's usage |
|---|---|---|
| CSS Subgrid | Newly Available | `test-matrix` table, behind `@supports (grid-template-rows: subgrid)`, plain grid fallback otherwise |
| Container queries | Widely Available | Used directly (comparison two-column grid, code note-rail layout) |
| `color-mix()` | Widely Available | Used directly (highlight tints, confidence-tag background) |
| `text-wrap: balance` / `pretty` | Newly Available | Used directly — pure progressive enhancement, degrades to normal wrap with no fallback needed |
| CSS nesting | Widely Available (native, current browser support) | Used directly (native `&` nesting, no preprocessor) for the confidence-tag and test-band-stat rule groups in `src/design/css.ts` |
| `:has()` | Widely Available | Not used in this MVP's component set |
| OKLCH | Widely Available | Used for all color tokens |
