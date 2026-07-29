# Architecture

```
src/
├── cli/           commander-based CLI; entry point dist/cli/index.js (bin: forma)
├── spec/          Zod schema (schema.ts), JSON Schema export, validate.ts
├── renderer/       compose.ts (assembles a spec into HTML), shell.ts (full
│                   document), blocks.ts (20 block renderers), diagrams.ts
│                   (deterministic SVG layout for flow/sequence/architecture/
│                   chart), highlight.ts (Shiki), diff-view.ts (unified diff
│                   parsing/rendering), interactive.ts (the one inline script),
│                   render.ts (file I/O: load spec → write index.html/manifest)
├── design/        tokens.ts (primitives), css.ts (the whole stylesheet,
│                   `@layer`-based), fonts.ts (per-document font subsetting)
├── security/       sanitize.ts — the one escaping/sanitization boundary
│                   every block renderer goes through
└── qa/            design-lint.ts (static CSS pattern lint), run-qa.ts
                    (Playwright + axe across 4 viewports × 4 fixtures),
                    run-lighthouse.ts (performance/a11y/best-practices)
```

## Data flow

1. **Input** — an Agent (or a human) writes `forma.spec.json`, following
   `src/spec/schema.ts` (also exported as JSON Schema via `forma schema`).
2. **Validate** — `validateFormaSpec()` — Zod parse with human-readable
   error paths.
3. **Compose** — `composeDocument()` walks `spec.sections`, calling the one
   renderer per block `type` in `blocks.ts`, and collects every visible
   string in the document (`collectText()`) so the font pipeline knows
   exactly which glyphs to keep.
4. **Font subsetting** — `buildFontFaceCss()` subsets Geist / Geist Mono /
   IBM Plex Sans KR to the glyphs this specific document uses (HarfBuzz via
   `subset-font`), embedding the result as base64 WOFF2 `@font-face` rules.
5. **Shell** — `renderSpecToHtml()` wraps the composed body + stylesheet +
   inline script into one `<html>` document.
6. **Sanitize + redact** — `render.ts` runs the assembled HTML through
   `redactSecrets()` and `stripHomeDirectory()` before writing it to disk
   (defense in depth; block renderers already escape/sanitize per-field).
7. **Write** — `index.html`, a copy of the validated `forma.spec.json`, and
   `manifest.json` (generator version, artifact, purpose, byte size) land in the output
   directory.
8. **QA** — `run-qa.ts` (Playwright: viewports, console errors, external
   requests, overflow, heading order, axe-core) and `run-lighthouse.ts`
   (performance budget) verify the output; `design-lint.ts` statically
   scans the generated CSS for banned patterns.

## Why this split (not "Agent writes HTML")

Every block is a pure function `(block, context) → HTML string`, sharing
one stylesheet built from one token set. That's what makes "20 different
visual grammars, one consistent design system" possible — the Agent picks
*which* block, never *how it looks*. It also makes the pipeline
deterministic: the same spec always produces the same bytes (modulo the
`manifest.json` file, which is metadata, not content).

## Extending it

- **New block type**: add to the `BlockSchema` discriminated union in
  `spec/schema.ts`, add a render function in `renderer/blocks.ts`, add its
  CSS to the `componentCss()` function in `design/css.ts`, add a unit test
  and (ideally) a fixture section exercising it.
- **New purpose**: purposes are a narrative-grammar convention documented in
  `skills-src/_shared/references/modes.md` — they don't require renderer code
  changes, since composition is entirely spec-side (which blocks, what
  order).
