# Forma

**Turn complex work into clear form.**

Forma reads documents, code, review topics, test results, and status
notes, and turns them into a polished, self-contained HTML page — no
server, no account, no external requests. Open it in a browser, offline.

```
input (markdown / diff / JUnit XML / CSV / notes)
        │
        ▼   Agent Skill (Codex / Claude Code) reads the input
   forma.spec.json
        │
        ▼   deterministic renderer (this repo)
   index.html — self-contained, offline, no tracking
        │
        ▼   Playwright + axe + Lighthouse
   pass/fail QA report
```

Five modes and four plain-language themes ([`DESIGN.md`](./DESIGN.md)):

| Mode | For |
|---|---|
| `explain` | Make a design, architecture, or code path understandable |
| `review` | Turn a diff/PR into a fast, decision-ready review page |
| `test` | Turn test results into a scannable pass/fail story with evidence |
| `report` | Turn notes/analysis into a stakeholder-ready report |
| `manual` | Turn a procedure into a safe, ordered, checkable guide |

Themes are `simple`, `workspace`, `guide`, and `magazine`. Older theme
identifiers still load and are normalized to these names.

## Try it

Requirements: Node.js 20.19 or newer and pnpm. Browser QA additionally needs
the Playwright Chromium binary (`pnpm exec playwright install chromium`).

```bash
pnpm install
pnpm build

pnpm forma render fixtures/review/forma.spec.json --out fixtures/review/output
pnpm forma qa fixtures/review/output
pnpm forma preview fixtures/review/output
# → http://localhost:4173/index.html
```

Four working examples ship in `fixtures/`: `explain`, `review`, `test`,
`report` — each with its source input, its `forma.spec.json`, and its
rendered `output/` (HTML + QA screenshots).

The `examples/{dashboard,report,manual,advanced}/` directories are one
document per artifact, and all four are about Forma itself: its current
state, why it compiles a spec instead of letting an agent write HTML, how to
drive it from an agent skill, and an open decision it has not made yet.

## CLI

```bash
forma init                      # write a starter forma.spec.json
forma validate <spec>           # schema-check a spec
forma render <spec> --out <dir> # spec → self-contained HTML
forma qa <html|dir>             # browser/axe/responsive/offline checks
forma preview <dir>             # serve rendered output over localhost
forma generate <input> --instruction "..." # infer mode and write a starter spec
forma build <spec>              # render + static design lint
forma install-skills            # sync skills/forma/ → Codex + Claude Code
forma verify-skills             # check the synced copies aren't stale
forma schema                    # print the Forma Spec JSON Schema
forma doctor                    # check the local environment
```

`generate` never overwrites an existing spec. It confirms the chosen mode,
preserves the input as a source, and prints the exact validation step. Use
`--out <new-path>` when the default filename already exists.

Full QA (Playwright + axe-core + Lighthouse, needs a browser):

```bash
forma qa <dir>    # deep QA for one rendered output
pnpm qa           # the same QA Module across all 4 canonical fixtures
pnpm lighthouse   # performance/accessibility/best-practices scores
pnpm lint:design  # static generic-AI-pattern CSS lint
pnpm test         # unit tests
```

## Using it from an Agent

```
Codex:       $forma review this diff for tomorrow's code review meeting
Claude Code: /forma turn this test-results folder into a visual report
```

The Agent reads your material, decides mode/theme/audience/language, and writes
`forma.spec.json` — it never generates raw HTML/CSS itself. See
[`skills/forma/SKILL.md`](./skills/forma/SKILL.md).

If `$forma` or `/forma` is missing, run `pnpm forma install-skills`, verify
with `pnpm forma verify-skills`, then start a new agent session. Skill lists
are discovered when a session starts, so copying the files cannot refresh an
already-open session.

## Why spec-first

An Agent regenerating full HTML/CSS on every request produces
inconsistent, often generic-looking output. Forma splits the problem:
the Agent picks **content, narrative, and semantic blocks**; a
deterministic TypeScript renderer owns **layout, tokens, accessibility,
and consistency**. Same spec in → byte-identical HTML out (timestamps
excluded).

## Project docs

- [`DESIGN.md`](./DESIGN.md) — the design system
- [`docs/product-brief.md`](./docs/product-brief.md) — what Forma is and isn't
- [`docs/architecture.md`](./docs/architecture.md) — how the pieces fit together
- [`docs/security.md`](./docs/security.md) — sanitization, offline guarantees, secret redaction
- [`docs/technology-audit.md`](./docs/technology-audit.md) — dependency versions/licenses and why
- [`docs/decisions.md`](./docs/decisions.md) — minor decisions made without blocking on approval
- [`CHANGELOG.md`](./CHANGELOG.md) — current changes, compatibility, and rollback
- [`docs/plan/README.md`](./docs/plan/README.md) — the original (Sensemark-named) planning docs vs. the Forma-renamed ones this build actually follows

## Status

MVP. Four fixtures render, pass axe/console/network checks, and have been
through two design-refinement passes (see
[`docs/design-iterations.md`](./docs/design-iterations.md)). See the
final build report for test results, Lighthouse scores, and known
limitations.
