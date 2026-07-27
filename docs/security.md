# Security

## Threat model

Forma's inputs are trusted-ish but not fully trusted: they're the user's
own documents/code/diffs, but may contain copy-pasted content from
elsewhere (logs, third-party diffs, pasted markdown) that could carry
malicious HTML/SVG, embedded secrets, or local paths that shouldn't be
published. The renderer treats every string as untrusted at the point it
reaches HTML.

## Sanitization boundary

`src/security/sanitize.ts` is the **only** place HTML is assembled from
untrusted strings:

- `escapeHtml()` — used by every block renderer for plain text content.
- `renderInlineMarkdown()` — the only path that allows any markup
  (bold/italic/inline-code/paragraphs) inside prose-like fields; it
  escapes first, then applies a fixed allowlist of transforms, then runs
  the result through `sanitizeFragment()` (DOMPurify) as defense in depth.
- `sanitizeSvg()` — every generated diagram/chart SVG is sanitized
  (DOMPurify's SVG profile, `<script>`/event-handler attributes stripped)
  before being inlined, even though Forma generates the SVG itself — this
  guards against a future bug in the diagram layout code accidentally
  passing through unescaped label text.
- `sanitizeUrl()` — only `http:`, `https:`, `mailto:`, and relative/anchor
  links are allowed; everything else (including `javascript:`, `data:`
  outside font embedding) becomes `#`.

No block renderer concatenates raw HTML strings outside this module.

## Secrets and local paths

`render.ts` runs the fully-assembled HTML through two more passes before
writing it to disk:

- `redactSecrets()` — regex patterns for private key headers, common API
  key/token shapes (`sk-...`, `AKIA...`, `ghp_...`), and
  `key/token/secret/password: value`-shaped strings. Matches are replaced
  with `[redacted]`.
- `stripHomeDirectory()` — replaces the invoking user's `$HOME` with `~`
  anywhere it appears, so a stray absolute path from a source file doesn't
  leak a username into shared output.

These are pattern-based safety nets, not a guarantee — a document author
should still avoid pasting live secrets into source material. See
`skills/forma/references/source-handling.md` for the Agent-side guidance
(mask/strip before writing the spec, don't rely solely on the renderer).

## Network

Rendered HTML makes **zero** external network requests — confirmed for
all four fixtures in `pnpm qa` (`externalRequests: []`). No CDN scripts,
no Google Fonts CSS API call (which would leak document text via the
`text=` query parameter — see `skills/forma/references/typography.md`),
no analytics/tracking. `file://` works with no server.

## Code execution

Forma never executes analyzed source code. Code/diff content is only ever
tokenized (Shiki, for syntax highlighting) or diffed (the `diff` package's
parser) — never `eval`'d, `require`'d, or shelled out to.

## Dependency posture

See `docs/technology-audit.md` for the full list. All runtime dependencies
are widely-used, actively maintained packages with permissive licenses
(MIT/Apache-2.0/BSD/OFL). No dependency was added without checking license
and maintenance status first.
