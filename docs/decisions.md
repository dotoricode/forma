# Decisions log

Minor, reversible decisions made without blocking on user input, per the
build instructions' rule that only irreversible/legal/scope-changing
choices need a question. Each entry: what, why, and what would change if
reversed.

## Product naming

- **Product name is Forma**, not Sensemark. The two `docs/plan/sensemark-*`
  files are the original planning documents (kept as historical record);
  `docs/plan/forma-*` are their Forma-renamed, corrected copies and are the
  documents actually followed. See `docs/plan/README.md`.
- Tagline: "Turn complex work into clear form." (Korean: "복잡한 업무를
  명확한 형태로.") — chosen to match the product name directly rather than
  reusing the Sensemark-era tagline.

## Package / distribution

- `package.json` uses `"name": "forma"` with `"private": true`. No npm
  publish. If the product is later open-sourced, the package name and
  license header should be reconfirmed with the user first (this is
  called out explicitly as an irreversible decision in the build
  instructions).
- JSON Schema `$id` is `https://forma.tools/schema/forma.schema.json` — a
  placeholder domain. Nothing is actually hosted there; update it if/when
  a real domain is assigned.
- LICENSE file (MIT, "Copyright (c) 2026 dotori") was left unchanged —
  copyright holder is a pre-existing decision outside this task's scope.

## Toolchain versions (see docs/technology-audit.md for full detail)

- TypeScript pinned to **5.9.3**, not the npm `latest` tag (7.0.2). TS 7 is
  a genuinely new native (Go-ported) compiler; given the ecosystem
  (tsx, vitest, ts-node-style tooling) is still stabilizing around it,
  5.9.3 — the newest release of the previous, widely-adopted major — was
  chosen for stability. This is the one deliberate "not literally newest"
  call; everything else uses the current `latest` npm tag.
- Zod v4, Shiki v4, Vitest v4, Playwright 1.62, Commander 15 — all current
  `latest` at implementation time.
- Dropped `zod-to-json-schema` after adding it: Zod v4 ships a native
  `z.toJSONSchema()`, and the package's own README says it's unmaintained
  and recommends switching to that native API for v4 schemas.

## Diagram/chart rendering (spec-internal conflict #4 in the plan)

- `flow`/`sequence`/`architecture`/`chart` blocks are rendered by Forma's
  own deterministic SVG layout engine (`src/renderer/diagrams.ts`) — no
  Mermaid or Vega-Lite runtime dependency was added for the MVP. This
  keeps the renderer's design language internally consistent (diagrams
  use the same design tokens as everything else) and avoids a
  browser-in-the-build-pipeline dependency for the common path.
- The build instructions describe an optional Mermaid/Vega-Lite build-time
  path for cases where source material is already in Mermaid/Vega-Lite
  syntax; that adapter was **not** implemented in this MVP pass (see
  Known Limitations in the final report) — flagged, not silently dropped.

## Font subsetting

- Fonts come from the `geist` and `@ibm/plex-sans-kr` npm packages (both
  SIL OFL-1.1), not by scraping Google Fonts. Each render subsets the
  actual font files to the glyphs that specific document uses via
  HarfBuzz (`subset-font`), rather than pre-building one fixed subset —
  this keeps every document's embedded font payload minimal regardless of
  language mix.
- Heading weight uses 700 (not the plan's suggested 600–650) because that
  is a real static weight file in `@ibm/plex-sans-kr`, keeping Latin and
  Hangul headings visually consistent without instancing tricks. Geist's
  variable font is pinned to 400/700 instances to match.
- The `geist` npm package declares a peer dependency on `next` (used only
  for one Next.js-specific export subpath we don't import). This adds
  `next`/`react`/`react-dom` to `node_modules` as install noise; none of
  it is imported by Forma's code or shipped in output HTML.

## CLI surface

- Implemented the union of the two v2 documents' CLI commands: `init`,
  `validate`, `render`, `preview`, `build`, `qa`,
  `install-skills`, `verify-skills`, `doctor`, `generate` (scaffold-only,
  documented as not calling any LLM), plus `schema`.
- `forma build` runs render + the static (non-browser) design lint only.
  `forma qa <html|dir>` runs the reusable browser/axe/responsive/offline
  gate for one Rendered Output; `pnpm qa` adapts that Module across the
  four canonical fixtures. Lighthouse remains separate so `build` stays
  fast and doesn't require a browser.

## Design direction

- The original Quiet Editorial direction remains the shared foundation.
  Research and user testing expanded it into four purpose-led themes with
  plain-language names: `simple`, `workspace`, `guide`, and `magazine`.
  Modes remain narrative purposes and themes remain visual treatments.

## Static design lint implementation

- Implemented as regex-based scanning of the generated `<style>` text
  rather than a full CSS AST parser (no `postcss` dependency added). The
  patterns being detected (pseudo-element border combinations, specific
  `content:` string literals, gradient function counts) don't need a full
  AST — the CSS Forma emits is machine-generated and structurally
  predictable. Documented as a scope simplification in the final report.
