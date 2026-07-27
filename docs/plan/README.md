# Plan documents

This directory holds the product/build specification for Forma.

## Canonical (use these)

- `forma-mvp-agent-build-instructions-v2.md` — authoritative build instructions
- `forma-agent-start-prompt-v2.md` — authoritative agent start prompt

## Legacy originals (kept for historical record, do not edit, do not treat as current)

- `sensemark-mvp-agent-build-instructions-v2.md`
- `sensemark-agent-start-prompt-v2.md`

These were written under the project's original working name, **Sensemark**. The
product was renamed to **Forma** before implementation began. The two `sensemark-*`
files are preserved unchanged as a historical record of the original planning
work; every requirement in them was carried over into the `forma-*` documents
above with the product name (and all derived identifiers — CLI name, spec file
name, skill paths, environment variables, tagline, etc.) updated to Forma.

Any occurrence of "Sensemark" elsewhere in this repository is a bug except for
these two legacy files. See `scripts/check-naming.mjs`.
