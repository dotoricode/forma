# Quality gates before reporting "done"

1. `forma validate <spec>` passes.
2. `forma render <spec> --out <dir>` produces `index.html` with no thrown
   errors.
3. `scripts/audit-design.mjs <dir>/index.html` reports no generic-AI
   pattern violations (or you've reviewed and justified any it flags).
4. When a browser is available: `forma qa <output-dir>` — Playwright across
   1920×1080/1440×900/1024×768/390×844, axe-core, console-error, overflow,
   heading-order, offline-network, reduced-motion, dark-mode, and
   JavaScript-disabled checks — passes for the Rendered Output you created.
   Use `pnpm qa` when changing Forma itself to run the same Module across
   all four canonical fixtures.
5. You looked at the actual screenshots (not just "it rendered") at least
   once, ideally twice with a refinement pass in between.
6. You checked dark mode and `prefers-reduced-motion`.
7. Report exactly what you ran and what you didn't — never claim a test
   passed if you didn't run it.
