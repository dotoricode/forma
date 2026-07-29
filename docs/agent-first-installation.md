# Agent-first installation

Status: proposal

## Decision to make

Forma should be introduced and installed as a set of Agent Skills. The CLI is
still required by the skills, but it is an implementation detail of the
installation rather than the product's primary interface.

The desired first-run experience is:

1. A person gives Codex or Claude Code one installation request.
2. The Agent follows the repository's installation guide.
3. All four Forma skills become available.
4. A new or reloaded Agent session can render an artifact from any working
   directory.

The person should not need to understand pnpm, Forma CLI commands, generated
skill directories, or host-specific frontmatter.

## Current mismatch

The repository currently exposes three different stories:

- `README.md` presents four public skills.
- `forma build-skills` generates those four skills under ignored `dist/`.
- `forma install-skills` installs only the compatibility `forma` router.

The installed router also needs either a Forma source checkout, `FORMA_REPO`,
or a `forma` executable on `PATH`. Copying the skill alone can therefore
succeed while its first render fails.

This is two shallow installation modules with different outcomes. The user
must understand their implementations to choose the correct one.

## Proposed public interface

Keep four public skills because each artifact has a different reader contract
and discovery vocabulary:

| Artifact | Codex | Claude Code |
|---|---|---|
| dashboard | `$forma-dashboard` | `/forma:dashboard` |
| report | `$forma-report` | `/forma:report` |
| manual | `$forma-manual` | `/forma:manual` |
| advanced | `$forma-advanced` | `/forma:advanced` |

Installation has one human-facing interface: ask the Agent to install Forma
from this repository. The README supplies a copyable prompt rather than
starting with terminal commands.

Host-specific mechanics stay behind that interface:

- Codex installs four generated skill directories into its user skill root.
- Claude Code adds this repository as a marketplace and installs one `forma`
  plugin containing four skills.
- The installer records the source checkout used as the renderer runtime, so
  the skills work outside the Forma repository.

The existing `forma` router is removed when it is a checksum-verified generated
copy. An unknown or edited copy is never deleted automatically; the installer
reports it for manual resolution.

## Proposed module shape

Create one deep installation Module:

```text
installAgentSkills({ host, scope, sourceDir })
    ├── read and validate skills-src/
    ├── emit host packages
    ├── install through the selected host Adapter
    ├── record the renderer runtime location
    └── verify the installed result
```

Its interface returns installed skill names, paths, invocation names, runtime
location, and verification results. Callers do not separately build, copy,
checksum, and verify packages.

There are two real Adapters at the host seam:

- `CodexSkillAdapter`: installs four directories and verifies their
  frontmatter and checksums.
- `ClaudePluginAdapter`: emits the plugin and marketplace manifests, invokes
  the supported Claude plugin installation flow, and validates the plugin.

`build-skills` may remain as a maintainer-only packaging command, but it must
call the same Module. `install-skills` becomes the user installation command
and must not maintain a second source format.

Tests cross the installation interface using temporary home directories and a
fake command runner. Existing tests tied to the old copy implementation are
replaced once equivalent interface-level coverage exists.

## Runtime contract

The first implementation keeps a local Forma checkout as the runtime. The
installing Agent may clone the public repository, install dependencies, and
build it. The installed skill records that checkout in generated runtime
metadata instead of requiring a persistent shell environment variable.

This is intentionally smaller than publishing a standalone binary or npm
package. A self-contained runtime can be considered later if real installation
data shows that maintaining a source checkout is the main source of failure.

The installer must fail with a concrete recovery command when:

- Node.js or pnpm is unavailable;
- dependency installation or the build fails;
- the host cannot be detected;
- the target is not writable;
- a Claude marketplace or plugin command is unavailable; or
- installed files differ from the generated package.

## README information architecture

The README should serve Agent users in this order:

1. What Forma produces, with one visual example.
2. **Install in Codex** and **Install in Claude Code**, each with a copyable
   Agent request and the resulting skill names.
3. Three short usage examples phrased as Agent requests.
4. The four artifact choices and when the Agent selects each one.
5. Offline, provenance, and QA guarantees.
6. How the Agent and deterministic renderer divide responsibility.
7. A short contributor section linking to build, test, CLI, architecture, and
   design-system documentation.

The current `Try it`, full CLI listing, fixture inventory, and maintainer
commands move out of the primary path. They belong in a contributor/CLI
document linked near the end.

## Delivery sequence

1. Replace the duplicate build/install implementations with the installation
   Module and its two host Adapters.
2. Add the Claude plugin and marketplace manifests generated from
   `skills-src/`.
3. Make Codex installation install all four generated skills.
4. Add runtime metadata and make the shared scripts resolve it.
5. Add fresh-home installation tests for both hosts.
6. Rewrite `README.md` around Agent installation and usage.
7. Move detailed CLI and maintainer instructions to `docs/cli.md`.
8. Verify both installed skill lists and render one artifact from outside the
   Forma checkout.

## Acceptance criteria

- A person can start installation by pasting one request into either supported
  Agent.
- Four documented skills appear after the documented reload/restart step.
- The documented invocation names match what each host displays.
- An installed skill renders from a separate project directory.
- No human-facing quickstart requires pnpm or a Forma CLI command.
- The README does not imply that ignored build output is already installed.
- Existing modified skills are not overwritten or deleted without a clear
  conflict report.
- Installation and verification use the same generated package model.

## Out of scope for this change

- Publishing Forma to npm.
- Shipping a standalone binary.
- Supporting Agent hosts other than Codex and Claude Code.
- Removing the CLI used internally by the skills and by contributors.
