# Forma

**Turn complex work into clear form.**

Forma gives Codex and Claude Code four Agent Skills for turning documents,
code, test results, metrics, and decision material into polished,
self-contained HTML. You ask the Agent for the artifact; the Agent reads the
source, writes a structured spec, renders it, and checks the result.

The output is one offline HTML file: no account, no server, no tracking, and no
external network requests.

**[Open the visual introduction](./docs/forma-introduction/output/index.html)**
· [See a dashboard](./examples/dashboard/output/index.html)
· [See a report](./examples/report/output/index.html)
· [See a manual](./examples/manual/output/index.html)
· [See a Decision Room](./examples/advanced/output/index.html)

## Install in your Agent

Give your Agent one of these requests. It will clone or update Forma, prepare
the renderer, install all four skills, and verify the result by following
[`docs/agent-install.md`](./docs/agent-install.md).

### Codex

```text
Install Forma for Codex from https://github.com/dotoricode/forma.
Follow docs/agent-install.md exactly, use user scope, verify that all four
Forma skills were installed, and tell me when I need to restart Codex.
```

After restarting Codex, these skills are available:

```text
$forma-dashboard
$forma-report
$forma-manual
$forma-advanced
```

### Claude Code

```text
Install Forma for Claude Code from https://github.com/dotoricode/forma.
Follow docs/agent-install.md exactly, use user scope, verify that the Forma
plugin contains all four skills, and reload the plugins when finished.
```

After running `/reload-plugins`, these skills are available:

```text
/forma:dashboard
/forma:report
/forma:manual
/forma:advanced
```

The installation keeps a local Forma checkout as the rendering runtime. The
Agent handles the checkout, dependencies, build, host-specific packaging, and
runtime connection. If a prerequisite is missing, it reports the exact
recovery step instead of leaving a skill that cannot render.

## Use Forma

Ask for the outcome you need and point the Agent at the source material.

```text
$forma-report Review this diff for tomorrow's architecture meeting.

$forma-dashboard Turn these CI results and crash metrics into a release gate.

$forma-manual Convert the setup notes in docs/onboarding into a guide that a
new engineer can follow and verify.
```

With Claude Code, use the corresponding `/forma:report`,
`/forma:dashboard`, or `/forma:manual` command.

The Agent owns meaning, narrative, source attribution, and semantic block
selection. Forma's deterministic renderer owns layout, typography,
accessibility, sanitization, and visual consistency. The Agent never writes
the final HTML or CSS by hand.

## Four artifacts

Each skill represents a reader contract, not a visual theme:

| Skill | Artifact | Use it when the reader needs |
|---|---|---|
| `dashboard` | Signal Grid | Current state, important numbers, changes, and drivers |
| `report` | Editorial Brief | A conclusion, evidence, alternatives, risks, and a recommendation |
| `manual` | Guided Path | Ordered steps, expected results, checks, and recovery |
| `advanced` | Decision Room | A group decision, counter-arguments, simulation, dissent, and a durable record |

`dashboard`, `report`, and `manual` can be selected automatically from the
request. `advanced` is explicit-invocation only because it assumes a real
decision with real stakeholders.

## What the Agent does

```text
source material
      │
      ▼
Forma Agent Skill reads, attributes, and structures the material
      │
      ▼
forma.spec.json
      │
      ▼
deterministic renderer
      │
      ▼
self-contained index.html
      │
      ▼
design, responsive, accessibility, and offline checks
```

Facts and inferences remain distinct in the spec. A claim can only be marked
`verified` when a source directly supports it. The rendered file embeds its
styles and locally subset fonts, sanitizes authored content, and makes zero
external requests.

## For contributors

The CLI is the renderer and maintainer interface used behind the Agent Skills.
It is not the primary product surface.

- [`docs/cli.md`](./docs/cli.md) — local setup, CLI commands, and quality gates
- [`DESIGN.md`](./DESIGN.md) — design-system source of truth
- [`docs/architecture.md`](./docs/architecture.md) — renderer architecture
- [`docs/agent-first-installation.md`](./docs/agent-first-installation.md) — installation design
- [`docs/security.md`](./docs/security.md) — sanitization and offline guarantees
- [`docs/product-brief.md`](./docs/product-brief.md) — product scope
- [`CHANGELOG.md`](./CHANGELOG.md) — changes and compatibility notes

## Status

MVP. All four artifacts have canonical fixtures and pass responsive,
accessibility, console, network, and design checks. Forma currently supports
Codex and Claude Code.
