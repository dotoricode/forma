# Forma — dashboard (Signal Grid)

Build a dashboard: dense, numeric, state-first. The reader arrives asking
"is something wrong, and where", and should get the answer before they
scroll. `meta.artifact` is fixed to `dashboard`; you do not choose it.

## What a dashboard owes the reader

`forma validate` enforces these as composition roles. A missing one is a
build error, not a style note.

| Role | What answers it |
|---|---|
| `status` | `status-header` — the one-line verdict, up front |
| `kpi` | `metric` / `metric-group` — the numbers that decide the verdict |
| `change` | `metric` comparisons, `anomaly` — what moved |
| `driver` | `breakdown` — what made it move |
| `freshness` | `data-freshness` — as of when, covering what |

## Workflow

1. **Read the material.** Logs, CI output, telemetry, CSVs. If a number you
   need is genuinely absent, say so in the document rather than estimating.
2. **Write the verdict first.** `narrative.question` is the question the
   reader arrived with; `narrative.summary` answers it in one or two
   sentences. If you cannot write the verdict, you do not understand the data
   well enough to build the dashboard yet.
3. **Pick `variant`**: `overview`, `diagnostic`, or `release-gate`.
4. **Give every metric a `period`.** A number without a time window is not a
   measurement. This is a build error, not advice.
5. **Make comparisons carry `basis` and `sentiment`.** Cost up and pass rate
   up are both "up" and mean opposite things; the renderer cannot guess which.
6. **Explain the movement, do not just show it.** A `breakdown` whose
   `reading` says "78% of the rise came from one OS" is worth more than the
   same four numbers with no sentence.
7. **State the data's limits.** `data-freshness.knownGaps` is where you admit
   what the numbers do not cover. A dashboard that hides its blind spots is
   the failure mode this artifact has.
8. **Validate, render, check.** `scripts/validate.mjs`, then
   `scripts/render.mjs`, then `scripts/audit-design.mjs` and `scripts/qa.mjs`.
9. **Report** the output path, what you verified, and what you did not.

## Traps specific to this artifact

- **Metrics without a freshness block.** Rejected by the validator. The fix is
  to state your cutoff, not to drop the metrics.
- **A wall of tiles.** Twelve equal metrics rank nothing. Lead with the three
  or four that decide the verdict and put the rest in a `segmented-table`.
- **Sparklines with no scale.** A `series` is a shape, not a measurement.
  Keep the number next to it.

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
