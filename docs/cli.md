# Forma CLI and contributor setup

The CLI is the deterministic renderer and maintainer interface behind the
Forma Agent Skills. Most Forma users should start with the Agent installation
in [`README.md`](../README.md).

## Local setup

Requirements: Node.js 20.19 or newer and pnpm 10. Browser QA additionally
needs Playwright Chromium.

```bash
pnpm install
pnpm build
pnpm exec playwright install chromium
```

Render and inspect a canonical fixture:

```bash
pnpm forma render fixtures/review/forma.spec.json --out fixtures/review/output
pnpm forma qa fixtures/review/output
pnpm forma preview fixtures/review/output
```

## Commands

```text
forma init
forma validate <spec>
forma render <spec> --out <dir>
forma build <spec>
forma advanced <spec> --portable
forma advanced <spec> --room [--lan]
forma qa <html|dir>
forma preview <html|dir>
forma generate <input> --instruction "..."
forma schema
forma doctor
```

Agent Skill maintainer commands:

```text
forma install-skills --host codex --scope user
forma install-skills --host claude --scope user
forma install-skills
forma verify-skills
forma build-skills [--out <dir>]
```

`install-skills` with an explicit host performs an end-user installation.
Without a host it synchronizes the four standalone generated skills to every
root in `~/.agents/skill-targets.json`.

`generate` scaffolds a starter spec and never calls an LLM. It does not
overwrite an existing spec.

## Quality gates

```bash
pnpm build
pnpm test
pnpm lint:design <html>
pnpm qa
pnpm lighthouse
pnpm forma verify-skills
```

`pnpm qa` exercises all canonical fixtures across 2048, 1920, 1440, 1024,
and 390 pixel viewports. It checks console errors, external requests,
horizontal overflow, clipped text, broken anchors, and axe violations.

## Skill sources

Host-neutral skill metadata and instructions live in:

```text
skills-src/{dashboard,report,manual,advanced}/
skills-src/_shared/
```

Host Adapters derive the Claude Code plugin and Codex standalone packages.
Generated packages under `.agents/skills/`, `.claude/skills/`, and
`dist/agent-skills/` are intentionally untracked. Never edit them directly.
