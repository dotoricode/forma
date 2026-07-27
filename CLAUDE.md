# CLAUDE.md

- Design system source of truth: `DESIGN.md`.
- Canonical Agent Skill: `skills/forma/` (synced to `.claude/skills/forma/`
  via `pnpm forma install-skills` — edit the canonical copy only).
- Build: `pnpm build`. Test: `pnpm test`. Full browser QA: `pnpm qa`.
  Performance: `pnpm lighthouse`. Design lint: `pnpm lint:design`.
- Confidentiality/security: never call an external LLM API or send
  document content to a third-party network endpoint (fonts are
  self-hosted and subset locally — see
  `skills/forma/references/typography.md`). Rendered HTML makes zero
  network requests. See `docs/security.md`.

## Agent skills

### Issue tracker

Issues and PRDs live in GitHub Issues for `dotoricode/forma`. See
`docs/agents/issue-tracker.md`.

### Triage labels

Use the five canonical triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository using root `CONTEXT.md` and
`docs/adr/`. See `docs/agents/domain.md`.
