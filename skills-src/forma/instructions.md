# Forma

Forma turns complex work into clear form. You read the material, decide what
it needs to say, and write a `forma.spec.json`. A deterministic renderer turns
that into a single offline HTML file. **You never write HTML or CSS for the
output** — that is the renderer's job. Yours is content, narrative, and block
selection.

## Before you build: propose, then agree

There is one artifact choice and it changes everything downstream: what the
document owes the reader, which blocks exist, and what the validator demands.
Getting it wrong wastes the whole build, and the person asking usually has not
thought about artifacts at all.

So do not pick silently. **Say what you are going to make, and why, and wait.**

1. Read the request and enough of the material to have an opinion.
2. Work out the shape: which artifact, which variant, what the reader is
   supposed to do with the result.
3. Tell the user, in four short parts:
   - **무엇을 만들 것인가** — the artifact and variant, in plain words, not
     jargon. "지표 중심 대시보드 (release-gate)" rather than "Signal Grid".
   - **왜 그것인가** — the one sentence in their request that decided it.
   - **무엇이 들어가고 무엇이 빠지는가** — the two or three sections it will
     carry, and what it will not cover.
   - **가까운 대안** — the next-best artifact and when they would prefer it.
4. Ask for a yes, or for a correction. Keep it to a few lines; this is a
   check, not a form.
5. Build only after they answer.

Skip the wait in exactly two cases: the user already named the artifact or
variant, or they explicitly said to go ahead without checking. Announce your
choice anyway so it is on the record.

If the request is genuinely ambiguous between two artifacts, say so and offer
both rather than guessing and hoping. One clarifying exchange is cheaper than
a document with the wrong contract.

## Choosing the artifact

| The reader needs to… | Artifact | Playbook |
|---|---|---|
| see what changed and where the problem is | `dashboard` | `references/artifacts/dashboard.md` |
| understand a judgement and what backs it | `report` | `references/artifacts/report.md` |
| do something, in order, and check it worked | `manual` | `references/artifacts/manual.md` |
| decide something together, with dissent recorded | `advanced` | `references/artifacts/advanced.md` |

`advanced` assumes a real decision with real stakeholders. Do not route to it
on your own — offer it, and let the user ask for it.

**Read the playbook for the artifact you settled on.** It carries the
composition contract, the workflow, and the traps specific to that artifact.
Do not work from this file alone.

## Workflow after agreement

1. **Fix `meta`.** `artifact`, `purpose`, `audience`, `language`, `variant`,
   `density`. Purpose is one of `monitor | diagnose | compare | decide |
   explain | operate | troubleshoot`.
2. **Separate fact from inference.** Anything a source does not directly
   support is `inferred` or `unknown`, never `verified`. See
   `references/source-handling.md`.
3. **Choose blocks, not layouts.** 59 semantic blocks: 34 shared, 25 belonging
   to one artifact. See `references/block-selection.md` and the playbook.
4. **Write `forma.spec.json`** per `references/spec-reference.md`. The schema
   is strict and rejects unknown shapes.
5. **Validate** with `scripts/validate.mjs`. Fix what it reports.
6. **Render** with `scripts/render.mjs`.
7. **Check** with `scripts/audit-design.mjs`, and `scripts/qa.mjs` when a
   browser is available.
8. **Report** the output path, the artifact you built, your assumptions, and
   what you did not verify.

## Hard constraints

- Never write HTML or CSS by hand for the output. You write the spec.
- Never call an external LLM API or send document text to a third-party
  service, including Google Fonts (see `references/typography.md`).
- Never mark a claim `verified` unless a source directly supports it.
- Do not approximate a block that does not exist. A wrong-shaped output that
  validates is worse than a clear failure. Say what you could not express.
- Do not ship the first render. Look at it, check it against
  `references/generic-ai-patterns.md`, and fix at least once.

## References

- `references/artifacts.md` — the four artifacts and the contract each owes
- `references/artifacts/*.md` — the per-artifact playbooks
- `references/block-selection.md` — the shared block vocabulary
- `references/spec-reference.md` — the full `forma.spec.json` shape
- `references/source-handling.md` — provenance and confidence rules
- `references/design-grammar.md` — shared rules and per-artifact direction
- `references/generic-ai-patterns.md` — the banned-pattern checklist
- `references/quality-gates.md` — what "done" means
- `references/typography.md` — font stack and subsetting
- `references/technology-policy.md` — what the toolchain allows
- `references/performance-budget.md` — size and performance targets
