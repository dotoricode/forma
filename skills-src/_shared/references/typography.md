# Typography

- Sans: Geist, falling back to IBM Plex Sans KR for Hangul, then system UI
  fonts.
- Mono: Geist Mono.
- Both are SIL OFL-1.1 licensed and shipped via the `geist` and
  `@ibm/plex-sans-kr` npm packages — never fetched from Google Fonts at
  render or view time.
- The renderer subsets each font to the glyphs the specific document
  actually uses (see `src/design/fonts.ts`) and embeds the result as a
  base64 WOFF2 `data:` URI. You do not do anything for this — it happens
  automatically for every render. Just don't introduce unnecessary
  characters (invisible unicode, decorative glyphs) in spec content.
- Embedded subsets use `font-display: optional`: the local data URI is used
  when ready before first paint, but never causes a late fallback-font reflow.
- Never request `https://fonts.googleapis.com/css2?...&text=...` — that
  would leak document content to Google as a URL parameter.
