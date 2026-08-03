# Forma — advanced (Decision Room)

Build a Decision Room: a document a group argues with, and that records what
they decided. `meta.artifact` is fixed to `advanced`; you do not choose it.

**This skill is explicit-invocation only.** It assumes a real decision with
real stakeholders. Do not select it on your own; if a request looks like it
might want this, build a `report` and say the Decision Room exists.

## What a Decision Room owes the reader

`forma validate` enforces these as composition roles.

| Role | What answers it |
|---|---|
| `brief` | `brief` — the question, what is decided today, what is still unknown |
| `evidence-graph` | `evidence-graph` — which claim rests on which source |
| `risk` | `challenge` — the strongest case against |
| `simulation` | `simulation` — let the room move the numbers |
| `decision` | `decision-record` — the outcome, its owner, and its dissent |

## Writing voice

Write like a facilitated decision record, not a persuasive report.

- Frame the opening as a question the room can close today.
- State claims, counterclaims, and assumptions as separate sentences. Do not
  smooth disagreement into neutral summary prose.
- Write the strongest counter-argument in its strongest form. Avoid
  straw-man qualifiers such as "some may feel".
- Phrase simulation outputs conditionally: "At 12% adoption, payback moves
  to Q4", not "The model proves the option is safe".
- Record the final decision in past tense with owner, dissent, and explicit
  revisit conditions so a future reader can reconstruct the room.

## Workflow

1. **Write the question so it can be answered today.** `brief.decideToday` is
   the list the room can actually close. Anything else belongs in
   `stillUnknown`.
2. **Fill `stillUnknown` honestly.** This is the field that stops a room
   deciding on air. An empty one on a real decision is almost always a lie.
3. **Pick `variant`**: `architecture-review`, `release-decision`, or
   `incident-review`.
4. **Rank claims by exposure, not by order of discovery.** In the
   `evidence-graph`, `impact: high` with `confidence: unknown` is the pair the
   room should look at first, and the renderer sorts on it.
5. **Write the counter-argument you would least like to answer.**
   `challenge.strongestCounterargument` is authored at build time — nothing
   calls a model while the room is open. A weak counter-argument makes the
   whole artifact decorative.
6. **List `unprovenAssumptions` and `reversalTriggers`.** A decision with no
   stated trigger for revisiting it cannot be revisited honestly later.
7. **Keep simulation formulas to the closed AST.** `literal`, `variable`, and
   the four operators. No expression strings: they would run authored text
   with the page's privileges. Declare every variable an output reads.
8. **A decision needs an owner.** `decision-record.owner` is required because
   a decision with no owner is a wish. Record `dissent` even when it is
   uncomfortable — that is what makes the record honest a year later.
9. **Validate, render, check.** `scripts/validate.mjs`, then
   `scripts/render.mjs`, then `scripts/audit-design.mjs` and `scripts/qa.mjs`.
10. **Report** the output path and which claims are `unknown`.

## Portable and Room Mode

Two builds, two security postures. Never describe them with one sentence.

```
forma advanced <spec> --portable        a file you send
forma advanced <spec> --room [--lan]    a live session on this machine
```

| | `--portable` | `--room` |
|---|---|---|
| Server | none | binds `127.0.0.1`, or `0.0.0.0` with `--lan` |
| External network requests | 0 | 0 |
| Local network traffic | none | yes, that is what the mode is |
| Written to disk | the build | nothing until a Decision Freeze |
| `meta.interaction: "live"` | rejected | required for syncing |

**"No external network requests" and "participants talk over the LAN" are two
claims.** The manifest keeps them in two fields for that reason. Writing "Room
Mode makes no network requests" makes the security claim false, and it is the
claim people are trusting.

`--lan` is never implied. A Decision Freeze writes `decision.json`,
`snapshot.html`, and `manifest.json`; the snapshot makes zero requests of any
kind, because the room server is gone by the time anyone reads it.

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
