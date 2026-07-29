# Install Forma Agent Skills

This guide is written for an Agent performing the installation. The human
should only need to choose a host and approve the normal local filesystem and
package-install operations.

## Contract

An installation is complete only when:

- the Forma repository is present and built locally;
- all four host-specific skills are installed;
- every installed skill records the local renderer checkout;
- installed files match their generated checksums; and
- the Agent tells the human which reload or restart is required.

Do not copy `skills-src/` directly. Its instructions have no host frontmatter.
Do not copy the legacy `skills/forma` router. It does not expose the four
documented skills.

## 1. Prepare the runtime

Requirements:

- Git
- Node.js 20.19 or newer
- pnpm 10

Use a stable checkout that will not be removed with a temporary worktree:

```bash
FORMA_INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/forma"

if [ -d "$FORMA_INSTALL_DIR/.git" ]; then
  git -C "$FORMA_INSTALL_DIR" pull --ff-only
else
  git clone https://github.com/dotoricode/forma.git "$FORMA_INSTALL_DIR"
fi

pnpm --dir "$FORMA_INSTALL_DIR" install --frozen-lockfile
pnpm --dir "$FORMA_INSTALL_DIR" build
```

If the checkout contains local changes, preserve them and stop. Do not reset,
overwrite, or delete an existing checkout.

## 2. Install for the selected host

### Codex

```bash
pnpm --dir "$FORMA_INSTALL_DIR" forma install-skills --host codex --scope user
```

The installer writes real copies to the Codex user skill root, records
`FORMA_INSTALL_DIR` as their runtime, and verifies every package. It refuses to
overwrite an installed Forma skill that was modified after installation.

Expected invocations:

```text
$forma-dashboard
$forma-report
$forma-manual
$forma-advanced
```

Tell the human to start a new Codex session if the current session already
loaded its skill list.

### Claude Code

```bash
pnpm --dir "$FORMA_INSTALL_DIR" forma install-skills --host claude --scope user
```

The installer builds a local `forma` marketplace, installs its plugin through
Claude Code's supported plugin commands, and records `FORMA_INSTALL_DIR` as
the renderer runtime.

Expected invocations:

```text
/forma:dashboard
/forma:report
/forma:manual
/forma:advanced
```

Run `/reload-plugins` in Claude Code after installation.

## 3. Report the result

Report:

- the runtime checkout path;
- the four installed invocation names;
- whether generated compatibility copies were removed;
- any modified compatibility copy that was preserved; and
- the required restart or reload step.

Do not report success if only the legacy `$forma` or `/forma` skill is
visible.

## Updating

Repeat the same procedure. A fast-forward pull, frozen dependency install,
build, and host installation are intentionally idempotent. Existing generated
copies may be replaced; locally edited copies must be preserved and reported
as conflicts.
