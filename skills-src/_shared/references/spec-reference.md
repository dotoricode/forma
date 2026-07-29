# forma.spec.json reference

The canonical schema lives in `src/spec/schema.ts` (Zod) and is exported as
JSON Schema via `forma schema`. This is a human-readable summary.

```json
{
  "version": "0.2",
  "meta": {
    "title": "string, required",
    "subtitle": "string, optional",
    "artifact": "dashboard | report | manual | advanced",
    "purpose": "monitor | diagnose | compare | decide | explain | operate | troubleshoot",
    "audience": "self | engineering | qa | security | manager | executive | external",
    "language": "ko | en",
    "variant": "composition recipe inside the artifact, optional",
    "colorMode": "light | dark | auto (default light)",
    "density": "comfortable | compact (default comfortable)",
    "interaction": "static | islands | live (default static)",
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

`artifact` is not a theme. It selects a composition contract the planner
enforces: a report with no recommendation, or a dashboard with no data
freshness, fails `forma validate`. Pick the artifact from what the output
*is*, then pick `variant` from `references/artifacts.md`.

Specs written against 0.1 still render. They are migrated on read
(`mode`/`theme`/`designSystem` become `artifact`/`purpose`/`variant`/
`colorMode`) and are exempt from the composition contract, with warnings
naming what a 0.2 rewrite would add.

Run `forma validate <path>` before rendering — the schema is strict and
rejects unknown fields.
