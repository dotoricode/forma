# Changelog

## Unreleased

### Added

- `manual` mode and deterministic instruction-based mode selection.
- Four plain-language themes: `simple`, `workspace`, `guide`, and `magazine`.
- Browser QA checks for broken in-page navigation and keyboard reachability.
- Safe `generate` scaffolding that preserves its input as a Source and refuses
  to overwrite an existing file.

### Changed

- The canonical skill now explains when to use each mode and theme.
- Skill installation tells users to start a new agent session when discovery
  was already completed.
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
