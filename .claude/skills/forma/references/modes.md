# Mode narrative grammar

These are defaults, not a rigid template. If the material genuinely reads
better in a different order, change it and note why in `docs/decisions.md`
or the spec's own `notes` fields.

## explain

1. The question this material answers
2. Three-line summary
3. Mental model / architecture
4. Step-by-step flow
5. Key points in the code/design
6. Exceptions and common misunderstandings
7. Glossary
8. Sources

Suggested blocks: `cover`, `summary`, `flow`/`sequence`/`architecture`,
`annotated-code`, `key-points`, `glossary`, `source-note`.

## review

1. What this review needs to decide
2. Change summary
3. Before / after
4. Key diff with annotations
5. Impact scope
6. Risks and trade-offs
7. Test evidence
8. Open questions
9. Recommendation / decision request

Suggested blocks: `cover`, `summary`, `comparison`, `diff`, `finding`,
`risk`, `test-summary`, `decision`.

## test

1. Purpose and success criteria
2. Environment and scope
3. Process
4. Overall result summary
5. Per-environment/case matrix
6. Numbers or trends
7. Failure cases and evidence
8. Limitations
9. Next steps

Suggested blocks: `cover`, `test-summary`, `test-matrix`, `chart`, `finding`,
`annotated-code` (for failure evidence), `actions`.

## report

1. Executive summary
2. Background and problem
3. Key findings
4. Impact
5. Evidence
6. Options
7. Recommendation and rationale
8. Risks and dissent
9. Decision or next action needed

Suggested blocks: `cover`, `summary`, `timeline`, `finding`, `comparison`,
`decision`, `actions`.

## manual

1. What the reader will complete
2. Before-you-start requirements and safety notes
3. Ordered steps with expected results
4. Decision points and alternate paths
5. Verification checklist
6. Troubleshooting and recovery
7. Completion state and next action

Suggested blocks: `cover`, `summary`, `key-points`, `sequence`, `decision`,
`test-matrix`, `finding`, `actions`, `source-note`.

## Automatic mode choice

Choose the mode from the requested job, not the input file extension:

- "how it works", "summarize", "understand" → `explain`
- "review", "risk", "approve", "feedback" → `review`
- "test result", "failure", "coverage", "verification" → `test`
- "status", "findings", "stakeholder", "recommendation" → `report`
- "how to", "steps", "setup", "install", "operate", "manual" → `manual`

When signals conflict, prefer the explicit user noun or verb. Otherwise
choose the mode whose ending best matches the requested outcome.
