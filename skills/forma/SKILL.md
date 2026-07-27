---
name: forma
description: Create polished, self-contained visual HTML artifacts from complex documents, code, review topics, test results, and stakeholder reports. Use when the user wants to understand, review, verify, present, or explain technical material visually. Do not use for marketing landing pages or general web-app development.
---

# Forma

Forma turns complex work into clear form: read source material, decide what
it needs to say, write a `forma.spec.json`, and let the deterministic
renderer turn that into a single offline HTML file. You never write raw HTML
or CSS for the output — that is the renderer's job. Your job is content,
narrative, and block selection.

## When to use this skill

Use it when someone asks to visualize, explain, review, summarize test
results, or turn notes into a report — for an audience that will read the
result in a browser. Don't use it for marketing pages, app UIs, or anything
that isn't "explain this work to a human."

## Workflow

1. **Read the request and the material.** Identify what files or text are
   available. If a critical fact is genuinely missing, ask at most 3
   questions — don't block on things you can infer.
2. **Pick a mode.** One of `explain`, `review`, `test`, `report`. See
   `references/modes.md` for the narrative grammar of each.
3. **Decide audience, language, density.** `self | engineering | qa |
   manager | executive | external`; `ko | en`; `comfortable | compact`.
4. **Separate fact from inference.** Anything not directly evidenced by a
   source must be marked `confidence: "inferred"` or `"unknown"` — never
   `"verified"`. See `references/source-handling.md`.
5. **Choose blocks, not layouts.** Pick from the 20 semantic blocks in
   `references/block-selection.md`. Do not invent new visual patterns; if a
   block doesn't fit, use the closest existing one and say so in `notes`.
6. **Write `forma.spec.json`.** Follow `references/spec-reference.md`
   exactly — the schema is strict and will reject unknown shapes.
7. **Validate.** Run `scripts/validate.mjs <path-to-spec>` (wraps
   `forma validate`). Fix any reported issues before continuing.
8. **Render.** Run `scripts/render.mjs <path-to-spec> --out <dir>` (wraps
   `forma render`).
9. **Check design and performance gates.** Run `scripts/audit-design.mjs`
   and, when a browser is available, `scripts/qa.mjs` for the full
   Playwright/axe pass. See `references/quality-gates.md` and
   `references/generic-ai-patterns.md` for what "done" means.
10. **Report** the output path, mode, key assumptions, and what you
    verified — including anything you did NOT check.

## Hard constraints

- Never write HTML/CSS by hand for the final artifact. Only write
  `forma.spec.json`.
- Never call an external LLM API, fetch a remote URL for content, or send
  document text to any third-party service (including Google Fonts — see
  `references/typography.md`).
- Never claim a fact is `verified` unless a source directly supports it.
- Don't ship the first render. Look at the screenshots, look for the
  generic-AI patterns in `references/generic-ai-patterns.md`, and fix at
  least once before calling it done.

## References

- `references/modes.md` — narrative order per mode
- `references/design-grammar.md` — Quiet Editorial layout rules
- `references/typography.md` — font stack and subsetting rules
- `references/generic-ai-patterns.md` — the banned-pattern checklist
- `references/technology-policy.md` — what's allowed in the toolchain
- `references/performance-budget.md` — size/perf targets
- `references/block-selection.md` — the 20 blocks and when to use each
- `references/spec-reference.md` — the full `forma.spec.json` shape
- `references/source-handling.md` — provenance and confidence rules
- `references/quality-gates.md` — the QA checklist before reporting "done"
