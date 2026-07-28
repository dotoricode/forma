# Fixture: review

Synthetic PR review for a network reconnection change. Demonstrates:
`comparison` (before/after), `diff` (real unified diff with old/new line
numbers), `risk`, `test-summary`, `finding` (high severity), `decision`.

```bash
pnpm forma render fixtures/review/forma.spec.json --out fixtures/review/output
pnpm forma preview fixtures/review/output
```
