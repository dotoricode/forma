# Performance budget

Targets for a representative fixture (excluding user-supplied images):

| Metric | Target |
|---|---|
| HTML+CSS+JS (minified, no images/fonts) | ≤ 350KB |
| Initial JS (gzip) | ≤ 80KB |
| Initial CSS (gzip) | ≤ 70KB |
| Lighthouse mobile Performance | ≥ 95 |
| Lighthouse Accessibility | 100 |
| CLS | ≤ 0.05 |
| TBT | ≤ 100ms |
| External network requests (offline profile) | 0 |
| Console errors | 0 |

If a document blows the budget, the cause is almost always large
user-supplied images or an enormous code/diff block — solve it with
build-time optimization (image resizing, lazy loading, virtualization of
huge test matrices), not by deleting content or design fidelity.
