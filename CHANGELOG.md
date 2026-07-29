# Changelog

## Unreleased

### Added

- Agent-first installation for Codex and Claude Code. One host command now
  builds, installs, connects, and verifies all four artifact skills.
- A repository-local Claude Code marketplace and plugin package generated from
  the same host-neutral skill sources as the Codex packages.
- Runtime metadata that lets installed skills render from outside the Forma
  checkout.
- `manual` mode and deterministic instruction-based mode selection.
- Four plain-language themes: `simple`, `workspace`, `guide`, and `magazine`.
- Browser QA checks for broken in-page navigation and keyboard reachability.
- Safe `generate` scaffolding that preserves its input as a Source and refuses
  to overwrite an existing file.

### Changed

- `README.md` now treats Agent users as the primary audience; CLI setup and
  maintainer commands moved to `docs/cli.md`.
- The compatibility `$forma`/`/forma` router has been replaced by
  `dashboard`, `report`, `manual`, and explicit-only `advanced` skills.
- `install-skills` and `build-skills` now share one installation Module and
  host-specific Adapters instead of producing different skill sets.
- Generated Agent Skill packages moved from `dist/skills` to
  `dist/agent-skills` so packaging cannot delete the compiled installation
  code under `dist/skills`.
- Theme layouts now preserve visual flow at desktop and mobile widths.

### Compatibility

Existing specs remain valid. The legacy theme identifiers
`quiet-editorial`, `precision-workbench`, `developer-docs`, and
`editorial-magazine` are normalized to their new names during validation.
No manual migration is required.

### Rollback

Before upgrading a shared workflow, keep the previously working commit or
package artifact. If a regression appears, restore that revision and retain
the same `forma.spec.json`; legacy and current theme identifiers are both
accepted during this transition.
