# Fixture: test

Synthetic device × Android-version detection regression run. Demonstrates:
`test-summary`, `test-matrix` (sticky first column, horizontal scroll),
`chart` (bar), `annotated-code` for failure evidence, `actions`.

```bash
pnpm forma render fixtures/test/forma.spec.json --out fixtures/test/output
pnpm forma preview fixtures/test/output
```
