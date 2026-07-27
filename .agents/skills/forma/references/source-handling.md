# Source handling and confidence

- `confidence: "verified"` — you can point to the exact line/paragraph in a
  source that states this.
- `confidence: "inferred"` — reasonable given the sources, but not stated
  directly. Explain the inference in `notes`.
- `confidence: "unknown"` — you genuinely don't know; say so instead of
  guessing. The renderer marks this visually (warning-colored tag) so
  readers don't mistake it for a confirmed fact.
- Never upgrade an inferred/unknown fact to verified because it "sounds
  right" or because the confident phrasing reads better.
- If a number appears in a source, use that exact number — don't round or
  restate it differently across blocks.
- Give every Source a stable `id`, a useful `label`, the most precise
  available locator in `path`, and the matching `kind`. URL Sources should
  keep the canonical `http:` or `https:` URL so the Rendered Output can
  preserve a safe, inspectable link.
- Attach `sourceRefs` to each block that makes a source-derived claim.
  A closing `source-note` block with no refs renders the complete Source
  bibliography, including locators.
- For `confidentiality: "external"` documents, strip internal identifiers,
  internal hostnames, and ticket links from the content before writing the
  spec — not the renderer's job to guess what's sensitive.
