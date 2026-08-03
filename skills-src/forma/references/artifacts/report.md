# Forma — report (Editorial Brief)

Build a report: the conclusion comes first, then the evidence that earns it.
`meta.artifact` is fixed to `report`; you do not choose it.

## What a report owes the reader

`forma validate` enforces these as composition roles.

| Role | What answers it |
|---|---|
| `thesis` | `thesis` — the judgement, in one sentence |
| `summary` | `executive-summary` — the version for someone who stops here |
| `finding` | `headline-finding` — what you found, ranked by weight |
| `evidence` | `evidence-stack` — what each finding rests on |
| `alternatives` | `option-comparison` / `decision-matrix` — what else was possible |
| `recommendation` | `recommendation` / `decision` — what to do |
| `risk` | `risk-register` — what could go wrong with that |
| `provenance` | `source-ledger` — what each source covers and does not |

## Writing voice

Write like an edited brief making a case.

- Open with a thesis that can be challenged, not a topic label.
- Use complete claim sentences for headings. Each should still make sense
  when read alone in the page outline.
- Move from judgement to evidence to implication. Do not narrate the order
  in which the analysis happened.
- Name uncertainty precisely: "the sample excludes background sessions",
  not "more investigation may be needed".
- End recommendations with an owner, a condition, or a reversal trigger.
  A polished conclusion without one is editorially incomplete.

## Workflow

1. **Read the material before deciding what it says.** The thesis is a
   conclusion, so it comes last in your thinking and first in the document.
2. **Write the thesis as a claim someone could disagree with.** "Android 17
   support needs more work" is a topic. "Certifying now ships three known
   blockers to customers" is a thesis.
3. **Pick `variant`**: `executive`, `technical`, `postmortem`, or `editorial`.
4. **Separate claim from evidence structurally, not just verbally.** A
   `headline-finding` states the claim; the `evidence-stack` that points at it
   with `supports` holds what backs it. If a finding has no evidence stack,
   that is a fact about the finding worth noticing.
5. **Mark confidence honestly.** `verified` requires a source that directly
   says so. The validator rejects a verified claim citing nothing, and it is
   right to.
6. **Show the alternatives you rejected.** A recommendation with no
   `option-comparison` reads as the only thing anyone thought of. If you
   weight criteria in a `decision-matrix`, say in `note` which weight decides
   the outcome — usually one does.
7. **Attach conditions to the recommendation.** `conditions` is where you say
   what would make this advice wrong.
8. **Fill the source ledger's `limits`.** What a source does *not* cover is
   the part a reader cannot reconstruct on their own.
9. **Validate, render, check.** `scripts/validate.mjs`, then
   `scripts/render.mjs`, then `scripts/audit-design.mjs` and `scripts/qa.mjs`.
10. **Report** the output path, the assumptions, and what you did not check.

## Traps specific to this artifact

- **Burying the conclusion.** If the thesis is not readable in the first
  screen, the artifact is doing a different job than the one it claims.
- **Evidence that restates the claim.** "The tests fail" is not evidence for
  "the tests fail". Evidence names a source and says what it showed.
- **A risk register of platitudes.** Every risk needs a `mitigation` someone
  could actually run and an `owner`.

## Hard constraints

- Never write HTML or CSS by hand for the output. You write `forma.spec.json`
  and nothing else. The renderer owns every visual decision.
- Never call an external LLM API or send document text to a third-party
  service, including Google Fonts (see `references/typography.md`).
- Never mark a claim `verified` unless a source directly supports it. Use
  `inferred` or `unknown` and say which source is missing.
- Do not approximate a block that does not exist. A wrong-shaped output that
  validates is worse than a clear failure. Say what you could not express.
- Do not ship the first render. Look at it, check it against
  `references/generic-ai-patterns.md`, and fix at least once.

## References

- `references/artifacts.md` — the four artifacts and the contract each owes
- `references/block-selection.md` — the shared block vocabulary
- `references/spec-reference.md` — the full `forma.spec.json` shape
- `references/source-handling.md` — provenance and confidence rules
- `references/design-grammar.md` — shared rules and per-artifact direction
- `references/generic-ai-patterns.md` — the banned-pattern checklist
- `references/quality-gates.md` — what "done" means
- `references/typography.md` — font stack and subsetting
- `references/technology-policy.md` — what the toolchain allows
- `references/performance-budget.md` — size and performance targets
