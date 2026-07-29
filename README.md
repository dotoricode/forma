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

Four artifact contracts ([`DESIGN.md`](./DESIGN.md)):

| Artifact | For |
|---|---|
| `dashboard` | State-first metrics, release gates, and health checks |
| `report` | Findings, evidence, alternatives, and recommendations |
| `manual` | Safe ordered procedures with checks and recovery |
| `advanced` | Evidence-led group decisions and a durable record |

Purpose remains metadata; artifact determines composition. Older theme
identifiers still load and are normalized to these names.

## What Forma changes

Most generated pages make one Agent responsible for both understanding the
material and inventing the presentation. Forma gives those jobs different
owners:

- The **Agent** owns meaning, narrative, source attribution, and semantic
  block selection.
- The **compiler** owns layout, typography, accessibility, sanitization, and
  visual consistency.
- The **QA pipeline** checks the rendered result across browsers, viewports,
  accessibility rules, and the offline boundary.

This split makes the output repeatable without reducing every document to one
template. The artifact contract changes the information structure; the shared
renderer keeps the result coherent, portable, and inspectable.

**[Open the visual introduction](./docs/forma-introduction/output/index.html)**
· [View its source spec](./docs/forma-introduction/forma.spec.json)
· [Read the product brief](./docs/product-brief.md)

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

## Agent skills

`skills-src/` holds four logical skills, one per artifact, and
`forma build-skills` emits a package for each host:

| Logical | Claude Code | Codex |
|---|---|---|
| dashboard | `/forma:dashboard` | `$forma-dashboard` |
| report | `/forma:report` | `$forma-report` |
| manual | `/forma:manual` | `$forma-manual` |
| advanced | `/forma:advanced` | `$forma-advanced` |

The two hosts need different `name` values for the same skill: the Agent
Skills spec requires `name` to match the parent directory, and Claude
namespaces plugin skills as `plugin:skill` while Codex reads the bare
directory name. So the frontmatter is generated per host rather than
authored — `skills-src/*/instructions.md` carries no frontmatter at all.

`advanced` is explicit-invocation only, which also lands in two different
places: `disable-model-invocation` in Claude's frontmatter, and
`policy.allow_implicit_invocation: false` in `agents/openai.yaml` for Codex.

## CLI

```bash
forma init                      # write a starter forma.spec.json
forma validate <spec>           # schema-check a spec
forma render <spec> --out <dir> # spec → self-contained HTML
forma qa <html|dir>             # browser/axe/responsive/offline checks
forma preview <dir>             # serve rendered output over localhost
forma generate <input> --instruction "..." # infer mode and write a starter spec
forma build <spec>              # render + static design lint
forma install-skills            # assemble router + shared files → configured targets
forma verify-skills             # check the synced copies aren't stale
forma build-skills              # skills-src/ → Claude Code plugin + Codex packages
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
- [`docs/forma-introduction/output/index.html`](./docs/forma-introduction/output/index.html) — a visual introduction to Forma, rendered by Forma
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
