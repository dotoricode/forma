# Product brief

## What Forma is

A spec-first compiler that turns documents, code, review topics, test
results, and status notes into a self-contained, offline HTML page that's
easier to scan and understand than the equivalent Markdown. "Turn complex
work into clear form."

## What Forma is not

- Not a hosted SaaS, not a service with accounts.
- Not an LLM API wrapper — the renderer never calls a model.
- Not a general web-app framework or landing-page generator.
- Not a PDF/DOCX/video generator (a print stylesheet exists; it's not
  Forma's promised output format).

## The core idea

Split "understand the material" from "produce good HTML":

1. An Agent Skill (Codex or Claude Code) reads source material and writes
   a `forma.spec.json` — narrative, block choice, confidence per claim.
2. A deterministic TypeScript renderer turns that spec into semantic HTML,
   applying one consistent design system, with build-time syntax
   highlighting, build-time SVG diagrams/charts, and per-document font
   subsetting.
3. Playwright + axe-core + Lighthouse verify the result actually works —
   across viewports, accessibility, and performance.

The Agent never freehands HTML/CSS. This is the difference between "AI
generates a webpage" (inconsistent, often generic-looking) and "AI writes
structured content, a real compiler renders it" (consistent, accessible,
fast, always on-brand).

## Five modes and four themes

- `explain` — architecture/code/design understanding
- `review` — PR/change review meetings
- `test` — test result communication
- `report` — stakeholder reporting
- `manual` — ordered procedures with verification and recovery

Modes determine the narrative job. The `simple`, `workspace`, `guide`, and
`magazine` themes determine visual composition. They share the same tokens,
20 semantic blocks, renderer, accessibility rules, and offline guarantee.

## Non-goals for this MVP

No accounts/server/database, no LLM calls from the renderer itself, no
video, no presentation-file export, no full PDF typesetting engine, no
design template marketplace, no remote crawler, no GitHub App/OAuth, no
real-time collaboration. See the build instructions (§5) for the full
scope table.
