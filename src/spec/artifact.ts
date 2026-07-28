/**
 * Artifact: what the output *is*, not what it looks like.
 *
 * This replaces the old `designSystem` theme field, which only ever swapped
 * CSS over an identical DOM. Four themes over one DOM could change colour,
 * type, and spacing, but it could not make a dashboard answer "what changed
 * and where is the problem" while a manual answers "what do I do, in what
 * order". Those need different information structures, so they are artifacts
 * rather than themes.
 *
 * The old `mode` field is also folded in here. It recorded intent in the
 * manifest and influenced nothing, which meant `mode: "report"` guaranteed
 * no report-shaped output. `artifact` + `purpose` drive a composition
 * contract the planner actually enforces.
 */
import { z } from "zod";

export const ARTIFACTS = ["dashboard", "report", "manual", "advanced"] as const;
export const ArtifactSchema = z.enum(ARTIFACTS);
export type ArtifactKind = z.infer<typeof ArtifactSchema>;

/** What the reader is supposed to *do* with the artifact. */
export const PURPOSES = [
  "monitor",
  "diagnose",
  "compare",
  "decide",
  "explain",
  "operate",
  "troubleshoot",
] as const;
export const PurposeSchema = z.enum(PURPOSES);
export type Purpose = z.infer<typeof PurposeSchema>;

/**
 * Composition recipes within an artifact. Kept as one flat enum rather than
 * a per-artifact union because the planner validates the pairing anyway and
 * a discriminated meta object would make every spec noisier to write.
 */
export const VARIANTS = [
  // dashboard
  "overview",
  "diagnostic",
  "release-gate",
  // report
  "executive",
  "technical",
  "postmortem",
  "editorial",
  // manual
  "quickstart",
  "procedural",
  "troubleshooting",
  "reference",
  // advanced
  "architecture-review",
  "release-decision",
  "incident-review",
] as const;
export const VariantSchema = z.enum(VARIANTS);
export type Variant = z.infer<typeof VariantSchema>;

export const VARIANTS_BY_ARTIFACT: Record<ArtifactKind, readonly Variant[]> = {
  dashboard: ["overview", "diagnostic", "release-gate"],
  report: ["executive", "technical", "postmortem", "editorial"],
  manual: ["quickstart", "procedural", "troubleshooting", "reference"],
  advanced: ["architecture-review", "release-decision", "incident-review"],
};

export const DEFAULT_VARIANT: Record<ArtifactKind, Variant> = {
  dashboard: "overview",
  report: "technical",
  manual: "procedural",
  advanced: "architecture-review",
};

/** Art direction name per artifact. Used in docs and QA output, never in CSS. */
export const ART_DIRECTION: Record<ArtifactKind, string> = {
  dashboard: "Signal Grid",
  report: "Editorial Brief",
  manual: "Guided Path",
  advanced: "Decision Room",
};

export function isVariantOfArtifact(artifact: ArtifactKind, variant: Variant): boolean {
  return VARIANTS_BY_ARTIFACT[artifact].includes(variant);
}

/**
 * How much client-side behaviour the output carries. `static` is the default
 * because every standard artifact must stay readable with JS disabled;
 * `live` is only reachable through Advanced Room Mode.
 */
export const InteractionSchema = z.enum(["static", "islands", "live"]);
export type Interaction = z.infer<typeof InteractionSchema>;

/** Information density. Independent of artifact: any artifact can be either. */
export const DensitySchema = z.enum(["comfortable", "compact"]);
export type Density = z.infer<typeof DensitySchema>;

/** Light/dark selection. Renamed from `theme`, which collided with artifact themes. */
export const ColorModeSchema = z.enum(["light", "dark", "auto"]);
export type ColorMode = z.infer<typeof ColorModeSchema>;
