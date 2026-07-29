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

`forma qa <html|dir>` records and aborts every non-`file:` browser request
before transmission. A URL Source may render as a user-activated external
link, but loading the Rendered Output never follows that link automatically;
the link uses `noopener`, `noreferrer`, and a no-referrer policy.

### Room Mode is the one networked surface

`forma advanced --room` binds a local HTTP server. It is the only part of
Forma that listens on a socket, and the distinction it forces is worth
stating in the words the manifest uses:

- **External network requests: 0.** Unchanged, and now enforced rather than
  asserted — every room response carries
  `Content-Security-Policy: default-src 'none'; … connect-src 'self'`, so the
  browser itself refuses an outbound fetch to anywhere else.
- **Local network traffic: yes, and only if you asked.** The default bind is
  `127.0.0.1`; `--lan` is what binds `0.0.0.0`. Verified by connecting to the
  host's own LAN address without `--lan` and getting a refused connection.

Do not write "Room Mode makes no network requests". It makes no *external*
ones. `manifest.json` keeps `session` and `snapshot` as separate objects so
neither claim can be read as the other.

Controls on the listening surface:

- A 192-bit session token, generated per run, compared with
  `timingSafeEqual`, never written to disk, void when the process exits.
  Every request needs it, including the SSE stream.
- Requests with a foreign `Origin` are refused even with a valid token.
- Every client message is parsed against a bounded Zod schema before it
  reaches the state (`src/room/protocol.ts`). Request bodies are capped.
- Participant ids are never echoed to other participants, so one participant
  cannot vote as another.
- Room state is in memory only. **Nothing is written to disk until a Decision
  Freeze**, and the freeze reply carries file basenames rather than host
  paths, which with `--lan` would otherwise cross to another machine.
- `snapshot.html` contains no room panel and no client script. It makes zero
  requests of any kind, external or local.

## Code execution

Forma never executes analyzed source code. Code/diff content is only ever
tokenized (Shiki, for syntax highlighting) or diffed (the `diff` package's
parser) — never `eval`'d, `require`'d, or shelled out to.

## Dependency posture

See `docs/technology-audit.md` for the full list. All runtime dependencies
are widely-used, actively maintained packages with permissive licenses
(MIT/Apache-2.0/BSD/OFL). No dependency was added without checking license
and maintenance status first.
