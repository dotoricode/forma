# AGENTS.md

- Design system source of truth: `DESIGN.md`.
- Agent Skill sources: router instructions in `skills/forma/SKILL.md`, shared
  references/scripts/assets in `skills-src/_shared/`, and artifact-specific
  instructions in `skills-src/{dashboard,report,manual,advanced}/`.
  `pnpm forma install-skills` assembles the compatibility skill; never edit
  `.agents/skills/` or `.claude/skills/` copies directly.
- Build: `pnpm build`. Test: `pnpm test`. Full browser QA: `pnpm qa`.
  Performance: `pnpm lighthouse`. Design lint: `pnpm lint:design`.
- Confidentiality/security: never call an external LLM API or send
  document content to a third-party network endpoint (this includes
  Google Fonts — fonts are self-hosted and subset locally, see
  `skills-src/_shared/references/typography.md`). Rendered HTML makes zero
  network requests. See `docs/security.md`.
