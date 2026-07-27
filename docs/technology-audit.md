# Technology audit

Checked against the npm registry `latest` dist-tag on 2026-07-27 (this
build's start date). "Chosen" is what's pinned in `package.json`.

| Package | Latest (npm) | Chosen | License | Notes |
|---|---|---|---|---|
| node | — | ≥20.19 (Active LTS or newer; this machine runs 24.14.1) | MIT | `engines.node` in package.json |
| typescript | 7.0.2 | **5.9.3** | Apache-2.0 | See below — deliberate one-step-back for stability |
| vite | — | not used | — | See "Why no Vite" below |
| vitest | 4.1.10 | 4.1.10 | MIT | Unit tests |
| playwright / @playwright/test | 1.62.0 | 1.62.0 | Apache-2.0 | Browser QA |
| @axe-core/playwright | 4.12.1 | 4.12.1 | MPL-2.0 | Accessibility scan |
| shiki | 4.3.1 | 4.3.1 | MIT | Build-time syntax highlighting |
| zod | 4.4.3 | 4.4.3 | MIT | Spec schema + native `z.toJSONSchema()` |
| commander | 15.0.0 | 15.0.0 | MIT | CLI arg parsing |
| diff | 9.0.0 | 9.0.0 | BSD-3-Clause | Unified diff parsing |
| isomorphic-dompurify | 3.19.0 | 3.19.0 | Apache-2.0 (DOMPurify) | HTML/SVG sanitization |
| svgo | 4.0.2 | 4.0.2 | MIT | Available for SVG optimization (see limitations) |
| subset-font | 2.5.0 | 2.5.0 | MIT (wraps HarfBuzz, MIT) | Per-document font subsetting |
| geist | 1.7.2 | 1.7.2 | SIL OFL-1.1 | Geist + Geist Mono source files |
| @ibm/plex-sans-kr | 1.1.0 | 1.1.0 | SIL OFL-1.1 | Korean fallback typeface |
| lighthouse | 13.4.1 | 13.4.1 | Apache-2.0 | Performance/a11y/best-practices gate |
| chrome-launcher | 1.2.1 | 1.2.1 | Apache-2.0 | Points Lighthouse at Playwright's Chromium |

## Why TypeScript 5.9.3, not 7.0.2

`typescript@latest` on npm is genuinely 7.0.2 — the native (Go-ported)
compiler, not a prerelease tag. It's real and current, but it's a recent
architectural rewrite, and this build's toolchain (`tsx` for dev execution,
Vitest's esbuild-based transform, `@types/node`) hasn't had time to prove
out compatibility claims against it in this environment. 5.9.3 is the
final release of the previous major and is what the rest of the ecosystem
is still built and tested against. This is the one place in this build
where "most current" was intentionally traded for "least likely to cause
an afternoon of toolchain debugging." Revisit this once TS 7 has a few
more point releases and the dev-tool ecosystem (tsx/vitest/ts-node
equivalents) confirms support.

## Why no Vite

The v2 build instructions list Vite as a default suggestion. Forma's
output is a single static HTML string assembled by a Node script — there's
no client bundle to build, no HMR dev server needed, and no JSX/framework
compilation step. Introducing Vite would add a bundler in front of code
that doesn't need bundling. `tsc` (type-check + emit) plus `tsx` (fast dev
execution) covers the actual need. If Forma later ships a browser-side
interactive dev preview UI beyond the current tiny inline script, Vite (or
esbuild directly) would be the first thing reconsidered.

## Browser target

Baseline "Widely Available" as of 2026-07 is the default target. The one
Newly-Available feature used is CSS Subgrid (`grid-template-rows:
subgrid`), gated behind `@supports (grid-template-rows: subgrid)` with a
plain nested-grid fallback — see `src/design/css.ts`.

## Removed after evaluation

- **zod-to-json-schema** — added, then removed. Zod v4 ships a native
  `z.toJSONSchema()` and the package's own README recommends switching to
  it for v4 schemas; keeping both was redundant.
