# forma.spec.json reference

The canonical schema lives in `src/spec/schema.ts` (Zod) and is exported as
JSON Schema via `forma schema`. This is a human-readable summary.

```json
{
  "version": "0.1",
  "meta": {
    "title": "string, required",
    "subtitle": "string, optional",
    "mode": "explain | review | test | report | manual",
    "audience": "self | engineering | qa | manager | executive | external",
    "language": "ko | en",
    "designSystem": "simple | workspace | guide | magazine (default simple)",
    "theme": "light | dark | auto (default light)",
    "density": "comfortable | compact (default comfortable)",
    "confidentiality": "public | internal | confidential (default internal)"
  },
  "sources": [
    { "id": "string", "label": "string", "path": "string?", "kind": "file|diff|junit|note|log|url?" }
  ],
  "narrative": {
    "question": "string, required — what does this document answer?",
    "summary": "string, required",
    "takeaways": ["string", "..."]
  },
  "sections": [ /* one or more blocks — see block-selection.md */ ]
}
```

Every block requires `id` (unique, used as an anchor) and `type`. Optional
on every block: `sourceRefs: string[]`, `confidence`, `notes`.

Run `forma validate <path>` before rendering — the schema is strict and
rejects unknown fields.
