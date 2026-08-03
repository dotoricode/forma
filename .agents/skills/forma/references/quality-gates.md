# Quality gates before reporting "done"

1. `forma validate <spec>` passes.
2. `forma render <spec> --out <dir>` produces `index.html` with no thrown
   errors.
3. `scripts/audit-design.mjs <dir>/index.html` reports no generic-AI
   pattern violations (or you've reviewed and justified any it flags).
4. When a browser is available: `forma qa <output-dir>` — Playwright across
   2048×1272/1920×1080/1440×900/1024×768/390×844, axe-core, console-error,
   horizontal overflow, clipped HTML/SVG text, heading-order,
   offline-network, reduced-motion, dark-mode, and JavaScript-disabled
   checks — passes for the Rendered Output you created.
   Use `pnpm qa` when changing Forma itself to run the same Module across
   all four canonical fixtures.
5. You looked at the actual screenshots (not just "it rendered") at least
   once, ideally twice with a refinement pass in between.
6. You checked dark mode and `prefers-reduced-motion`.
7. You checked composition at desktop and mobile: one obvious first focal
   point, an intentional secondary reading path, no accidental grid break,
   and spacing that makes section transitions clear.
8. Report exactly what you ran and what you didn't — never claim a test
   passed if you didn't run it.


## Quality layers

Checks run at four layers, because a defect that is invisible at one is
obvious at another.

| Layer | Tool | Catches |
|---|---|---|
| CSS text | `lintCss` | rules that should not exist: bracket borders, ch measures, hardcoded colours, oklch mixing |
| Rendered DOM | `lintDom` | rules used too many times: card saturation, nested surfaces, layout repetition, badge clutter, orphan headings, prose runs, hover on non-interactive elements |
| Spec semantics | the planner | unfilled roles, unverifiable steps, metrics with no period, verified claims with no evidence |
| Browser | `forma qa` | axe violations, horizontal overflow, clipped text, console errors, external requests, heading order, keyboard reach |

`forma build --quality advanced` additionally renders eight distinct
composition candidates. Each candidate gets its own static lint and browser
probe at 2048, 1920, 1440, 1024, and 390 pixels before the winner is written.
Hard gates (external request, overflow, clipped text, axe violation, broken
anchor, unbacked verified claim) disqualify a candidate outright rather than
ranking it low: those are correctness, not taste.

Candidate selection is seeded. The same spec and the same `--seed` must
produce the same winner — a tournament that picks differently on re-run
would quietly break the reproducibility the rest of the pipeline protects.
