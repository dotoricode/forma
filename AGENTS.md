# AGENTS.md

- Design system source of truth: `DESIGN.md`.
- Agent Skill sources: shared references/scripts/assets in
  `skills-src/_shared/`, and artifact-specific metadata/instructions in
  `skills-src/{dashboard,report,manual,advanced}/`. `skills/forma/SKILL.md`
  is retained only to identify and safely remove the generated compatibility
  router during migration. `pnpm forma install-skills` builds and syncs all
  four skills to configured external targets. Generated `.agents/skills/` and
  `.claude/skills/` packages are not tracked; never edit them directly.
- Build: `pnpm build`. Test: `pnpm test`. Full browser QA: `pnpm qa`.
  Performance: `pnpm lighthouse`. Design lint: `pnpm lint:design`.
- Confidentiality/security: never call an external LLM API or send
  document content to a third-party network endpoint (this includes
  Google Fonts — fonts are self-hosted and subset locally, see
  `skills-src/_shared/references/typography.md`). Rendered HTML makes zero
  network requests. See `docs/security.md`.
