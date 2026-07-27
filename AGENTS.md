# AGENTS.md

- Design system source of truth: `DESIGN.md`.
- Canonical Agent Skill: `skills/forma/` (synced to `.agents/skills/forma/`
  and `.claude/skills/forma/` via `pnpm forma install-skills` — edit the
  canonical copy only, never the synced ones).
- Build: `pnpm build`. Test: `pnpm test`. Full browser QA: `pnpm qa`.
  Performance: `pnpm lighthouse`. Design lint: `pnpm lint:design`.
- Confidentiality/security: never call an external LLM API or send
  document content to a third-party network endpoint (this includes
  Google Fonts — fonts are self-hosted and subset locally, see
  `skills/forma/references/typography.md`). Rendered HTML makes zero
  network requests. See `docs/security.md`.
