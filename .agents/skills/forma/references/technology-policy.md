# Technology policy

See `docs/technology-audit.md` for the full version/license record. Summary:

- Node.js ≥ 20.19, TypeScript 5.9 (strict), modern ESM throughout.
- No React/Vue/Svelte runtime ships in output HTML.
- Diagrams and charts are rendered as plain SVG by Forma's own deterministic
  layout engine (`src/renderer/diagrams.ts`) at build time — no Mermaid or
  Vega-Lite runtime in the browser.
- Shiki does syntax highlighting at build time only.
- Zero external network requests from the rendered HTML. `file://` must
  work.
- Baseline "Widely Available" is the default browser target; anything
  "Newly Available" (subgrid, some `:has()` usage) is wrapped in
  `@supports` with a working fallback.
