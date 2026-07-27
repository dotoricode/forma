/**
 * Forma Spec schema — the single source of truth for what a `forma.spec.json`
 * document may contain. The renderer trusts nothing that hasn't passed this
 * schema: Agents write specs, this schema gates them, and the renderer turns
 * validated specs into HTML deterministically.
 */
import { z } from "zod";

export const FORMA_SPEC_VERSION = "0.1" as const;

export const ModeSchema = z.enum(["explain", "review", "test", "report", "manual"]);
export type FormaMode = z.infer<typeof ModeSchema>;

export const AudienceSchema = z.enum([
  "self",
  "engineering",
  "qa",
  "manager",
  "executive",
  "external",
]);
export type FormaAudience = z.infer<typeof AudienceSchema>;

export const LanguageSchema = z.enum(["ko", "en"]);
export const ThemeSchema = z.enum(["light", "dark", "auto"]);
/**
 * Visual layout/typography variant. Every value renders the exact same 20
 * semantic blocks and the exact same DOM — only the CSS layer and the
 * shell's data-design hook differ. Adding a design system means adding CSS
 * under `[data-design="..."]`, never writing a parallel block renderer.
 */
export const DESIGN_SYSTEMS = ["simple", "workspace", "guide", "magazine"] as const;
export const DesignSystemValueSchema = z.enum(DESIGN_SYSTEMS);
export type DesignSystem = z.infer<typeof DesignSystemValueSchema>;

export const LEGACY_DESIGN_SYSTEMS = {
  "quiet-editorial": "simple",
  "precision-workbench": "workspace",
  "developer-docs": "guide",
  "editorial-magazine": "magazine",
} as const satisfies Record<string, DesignSystem>;

export const DesignSystemSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value in LEGACY_DESIGN_SYSTEMS
      ? LEGACY_DESIGN_SYSTEMS[value as keyof typeof LEGACY_DESIGN_SYSTEMS]
      : value,
  DesignSystemValueSchema,
);
export const DensitySchema = z.enum(["comfortable", "compact"]);
export const ConfidentialitySchema = z.enum(["public", "internal", "confidential"]);
export const ConfidenceSchema = z.enum(["verified", "inferred", "unknown"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const SourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  path: z.string().optional(),
  kind: z.enum(["file", "diff", "junit", "note", "log", "url"]).optional(),
});
export type FormaSource = z.infer<typeof SourceSchema>;

const SourceRefs = z.array(z.string()).default([]);

/** Shared fields every content block may carry: provenance + confidence. */
const BlockBase = z.object({
  id: z.string().min(1),
  sourceRefs: SourceRefs.optional(),
  confidence: ConfidenceSchema.optional(),
  notes: z.string().optional(),
});

const CoverBlock = BlockBase.extend({
  type: z.literal("cover"),
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  meta: z.array(z.string()).default([]),
});

const SummaryBlock = BlockBase.extend({
  type: z.literal("summary"),
  title: z.string().min(1),
  body: z.string().min(1),
});

const ProseBlock = BlockBase.extend({
  type: z.literal("prose"),
  title: z.string().optional(),
  body: z.string().min(1),
});

const KeyPointsBlock = BlockBase.extend({
  type: z.literal("key-points"),
  title: z.string().optional(),
  points: z.array(z.string().min(1)).min(1),
});

const AnnotatedCodeBlock = BlockBase.extend({
  type: z.literal("annotated-code"),
  title: z.string().optional(),
  language: z.string().min(1),
  code: z.string(),
  highlightLines: z.array(z.number().int().positive()).default([]),
  annotations: z
    .array(
      z.object({
        line: z.number().int().positive(),
        text: z.string().min(1),
      }),
    )
    .default([]),
});

const DiffBlock = BlockBase.extend({
  type: z.literal("diff"),
  title: z.string().optional(),
  language: z.string().optional(),
  unifiedDiff: z.string().min(1),
});

const FlowNode = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["start", "step", "decision", "end"]).default("step"),
});
const FlowEdge = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
});
const FlowBlock = BlockBase.extend({
  type: z.literal("flow"),
  title: z.string().optional(),
  nodes: z.array(FlowNode).min(1),
  edges: z.array(FlowEdge).default([]),
});

const SequenceParticipant = z.object({ id: z.string().min(1), label: z.string().min(1) });
const SequenceMessage = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["call", "return", "async"]).default("call"),
});
const SequenceBlock = BlockBase.extend({
  type: z.literal("sequence"),
  title: z.string().optional(),
  participants: z.array(SequenceParticipant).min(1),
  messages: z.array(SequenceMessage).default([]),
});

const TimelineEntry = z.object({
  id: z.string().min(1),
  when: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().optional(),
  status: z.enum(["past", "current", "future"]).default("past"),
});
const TimelineBlock = BlockBase.extend({
  type: z.literal("timeline"),
  title: z.string().optional(),
  entries: z.array(TimelineEntry).min(1),
});

const ComparisonBlock = BlockBase.extend({
  type: z.literal("comparison"),
  title: z.string().optional(),
  left: z.object({ label: z.string().min(1), items: z.array(z.string()).default([]) }),
  right: z.object({ label: z.string().min(1), items: z.array(z.string()).default([]) }),
});

const ArchitectureNode = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  group: z.string().optional(),
});
const ArchitectureEdge = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
});
const ArchitectureBlock = BlockBase.extend({
  type: z.literal("architecture"),
  title: z.string().optional(),
  nodes: z.array(ArchitectureNode).min(1),
  edges: z.array(ArchitectureEdge).default([]),
});

const TestSummaryBlock = BlockBase.extend({
  type: z.literal("test-summary"),
  title: z.string().optional(),
  total: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative().default(0),
  durationMs: z.number().nonnegative().optional(),
});

const TestMatrixRow = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  cells: z.record(z.string(), z.enum(["pass", "fail", "skip", "na"])),
});
const TestMatrixBlock = BlockBase.extend({
  type: z.literal("test-matrix"),
  title: z.string().optional(),
  columns: z.array(z.string().min(1)).min(1),
  rows: z.array(TestMatrixRow).min(1),
});

const ChartSeries = z.object({
  label: z.string().min(1),
  values: z.array(z.number()).min(1),
});
const ChartBlock = BlockBase.extend({
  type: z.literal("chart"),
  title: z.string().optional(),
  kind: z.enum(["bar", "line"]).default("bar"),
  categories: z.array(z.string().min(1)).min(1),
  series: z.array(ChartSeries).min(1),
  unit: z.string().optional(),
});

const FindingBlock = BlockBase.extend({
  type: z.literal("finding"),
  title: z.string().min(1),
  body: z.string().min(1),
  severity: z.enum(["info", "low", "medium", "high", "critical"]).default("info"),
});

const RiskBlock = BlockBase.extend({
  type: z.literal("risk"),
  title: z.string().min(1),
  likelihood: z.enum(["low", "medium", "high"]),
  impact: z.enum(["low", "medium", "high"]),
  mitigation: z.string().min(1),
});

const DecisionBlock = BlockBase.extend({
  type: z.literal("decision"),
  title: z.string().min(1),
  status: z.enum(["proposed", "recommended", "decided", "rejected"]),
  rationale: z.string().min(1),
});

const ActionsBlock = BlockBase.extend({
  type: z.literal("actions"),
  title: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        owner: z.string().optional(),
        due: z.string().optional(),
      }),
    )
    .min(1),
});

const GlossaryBlock = BlockBase.extend({
  type: z.literal("glossary"),
  title: z.string().optional(),
  terms: z.array(z.object({ term: z.string().min(1), definition: z.string().min(1) })).min(1),
});

const SourceNoteBlock = BlockBase.extend({
  type: z.literal("source-note"),
  title: z.string().optional(),
});

export const BlockSchema = z.discriminatedUnion("type", [
  CoverBlock,
  SummaryBlock,
  ProseBlock,
  KeyPointsBlock,
  AnnotatedCodeBlock,
  DiffBlock,
  FlowBlock,
  SequenceBlock,
  TimelineBlock,
  ComparisonBlock,
  ArchitectureBlock,
  TestSummaryBlock,
  TestMatrixBlock,
  ChartBlock,
  FindingBlock,
  RiskBlock,
  DecisionBlock,
  ActionsBlock,
  GlossaryBlock,
  SourceNoteBlock,
]);
export type FormaBlock = z.infer<typeof BlockSchema>;
export type FormaBlockType = FormaBlock["type"];

export const NarrativeSchema = z.object({
  question: z.string().min(1),
  summary: z.string().min(1),
  takeaways: z.array(z.string().min(1)).default([]),
});

export const MetaSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  mode: ModeSchema,
  audience: AudienceSchema,
  language: LanguageSchema,
  theme: ThemeSchema.default("light"),
  designSystem: DesignSystemSchema.default("simple"),
  density: DensitySchema.default("comfortable"),
  confidentiality: ConfidentialitySchema.default("internal"),
});

export const FormaSpecSchema = z.object({
  version: z.literal(FORMA_SPEC_VERSION),
  meta: MetaSchema,
  sources: z.array(SourceSchema).default([]),
  narrative: NarrativeSchema,
  sections: z.array(BlockSchema).min(1),
});
export type FormaSpec = z.infer<typeof FormaSpecSchema>;

export function parseFormaSpec(json: unknown): FormaSpec {
  return FormaSpecSchema.parse(json);
}

export function safeParseFormaSpec(json: unknown) {
  return FormaSpecSchema.safeParse(json);
}
