# Changelog

## 0.1.0 — initial MVP

- Spec-first architecture: `forma.spec.json` (Zod schema) → deterministic
  TypeScript renderer → self-contained HTML.
- 20 semantic blocks, 4 modes (`explain`/`review`/`test`/`report`), one
  design system ("Quiet Editorial" — see `DESIGN.md`).
- Build-time syntax highlighting (Shiki, dual light/dark theme via CSS
  variables), build-time deterministic SVG diagrams/charts (no Mermaid or
  Vega-Lite runtime in the browser), per-document font subsetting (Geist /
  Geist Mono / IBM Plex Sans KR via HarfBuzz).
- CLI: `init`, `validate`, `render`, `preview`, `build`, `install-skills`,
  `verify-skills`, `doctor`, `schema`, `generate` (scaffold-only).
- Canonical Agent Skill at `skills/forma/`, synced to
  `.agents/skills/forma/` and `.claude/skills/forma/`.
- QA: Playwright across 4 viewports × 4 fixtures, axe-core, Lighthouse,
  static generic-AI-pattern CSS lint, unit tests (Vitest).
- Four working fixtures: `explain`, `review`, `test`, `report`.
- Renamed from the project's original working name, Sensemark, to Forma
  before implementation (see `docs/plan/README.md`).
