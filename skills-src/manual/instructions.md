# Forma — manual (Guided Path)

Build a manual: what to do, in what order, how to know it worked, and what to
do when it does not. `meta.artifact` is fixed to `manual`; you do not choose
it.

## What a manual owes the reader

`forma validate` enforces these as composition roles.

| Role | What answers it |
|---|---|
| `scope` | `task-map`, `audience-scope` — what this finishes, and what it does not |
| `prerequisite` | `prerequisite` — what must be true before step 1 |
| `quick-path` | `quick-path` — the commands, for someone who has done this before |
| `procedure` | `step` — the numbered work |
| `expected-result` | each step's `expectedResult` — how the reader knows it worked |
| `verification` | `checkpoint`, `completion-check` — the gates |
| `troubleshooting` | `troubleshooting` — symptom, cause, fix |

## Writing voice

Write like a calm operator standing beside the reader.

- Start step titles with one direct verb: "Install the skill", "Open the
  output", "Confirm the checksum".
- Use present-tense observable results: "The command prints four package
  names", not "The installation should probably complete successfully".
- Keep explanation after the action and before the check. Never hide an
  instruction inside background prose.
- Address failures in the reader's language: first the symptom they see,
  then the cause, then the smallest recovery action.
- The opening promises an outcome; the final check repeats the same outcome
  as something the reader can now observe.

## Workflow

1. **Run the procedure yourself if you can.** A manual written from reading
   the code is a guess about what happens. Say so if you could not run it.
2. **Write the outcomes before the steps.** `task-map.outcomes` is the promise;
   the steps are how it is kept. If you cannot state the outcome, the
   procedure has no end condition.
3. **Say what you are not covering.** `audience-scope.doesNotCover` prevents
   the reader following a guide that was never about their situation.
4. **Pick `variant`**: `quickstart`, `procedural`, `troubleshooting`, or
   `reference`.
5. **One action per step.** If a step has two verbs, it is two steps, and the
   reader will half-complete it.
6. **Every step needs `expectedResult`.** Without it the reader cannot tell a
   working step from a silently failing one. `ifItFails` is where you put the
   recovery.
7. **Put a `checkpoint` where being wrong gets expensive.** Not after every
   step — at the points where continuing on a bad state wastes real work.
8. **Troubleshooting entries need a cause.** Symptom and fix without cause
   teaches nothing and does not transfer to the next problem.
9. **Validate, render, check.** `scripts/validate.mjs`, then
   `scripts/render.mjs`, then `scripts/audit-design.mjs` and `scripts/qa.mjs`.
10. **Report** the output path, whether you ran the procedure, and what you
    did not verify.

## Traps specific to this artifact

- **Commands with no working directory.** `runIn` exists because "run this"
  is ambiguous the moment there is more than one directory.
- **Steps that assume the happy path.** The reader who needs the manual is
  usually the one whose environment differs.
- **A troubleshooting section written from imagination.** List the failures
  you actually hit. An invented symptom crowds out a real one.

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
