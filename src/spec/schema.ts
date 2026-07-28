/**
 * Forma Spec schema — the single source of truth for what a `forma.spec.json`
 * document may contain. The renderer trusts nothing that hasn't passed this
 * schema: Agents write specs, this schema gates them, and the renderer turns
 * validated specs into HTML deterministically.
 *
 * Block shapes are not defined here. They come from the block registry, so a
 * new block is registered once rather than being threaded by hand through a
 * schema enum, a union, a renderer switch, and an artifact allowlist.
 */
import { z } from "zod";
import { BlockSchemaUnion, type FormaBlock } from "../blocks/registry.js";
import {
  ArtifactSchema,
  ColorModeSchema,
  InteractionSchema,
  PurposeSchema,
  VariantSchema,
} from "./artifact.js";
import { SourceSchema } from "./source.js";

export const FORMA_SPEC_VERSION = "0.2" as const;
/** Specs written before artifacts existed. Normalized by `migrations.ts`. */
export const FORMA_LEGACY_SPEC_VERSION = "0.1" as const;

export const AudienceSchema = z.enum([
  "self",
  "engineering",
  "qa",
  "security",
  "manager",
  "executive",
  "external",
]);
export type FormaAudience = z.infer<typeof AudienceSchema>;

export const LanguageSchema = z.enum(["ko", "en"]);
export const DensitySchema = z.enum(["comfortable", "compact"]);
export const ConfidentialitySchema = z.enum(["public", "internal", "confidential"]);

export const NarrativeSchema = z.object({
  question: z.string().min(1),
  summary: z.string().min(1),
  takeaways: z.array(z.string().min(1)).default([]),
});

export const MetaSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  /** What the output *is*. Drives the composition contract the planner enforces. */
  artifact: ArtifactSchema,
  /** What the reader should do with it. */
  purpose: PurposeSchema,
  audience: AudienceSchema,
  language: LanguageSchema,
  /** Composition recipe inside the artifact. Checked against the artifact. */
  variant: VariantSchema.optional(),
  colorMode: ColorModeSchema.default("light"),
  density: DensitySchema.default("comfortable"),
  interaction: InteractionSchema.default("static"),
  confidentiality: ConfidentialitySchema.default("internal"),
});

export const FormaSpecSchema = z.object({
  version: z.literal(FORMA_SPEC_VERSION),
  meta: MetaSchema,
  sources: z.array(SourceSchema).default([]),
  narrative: NarrativeSchema,
  sections: z.array(BlockSchemaUnion).min(1),
});

/**
 * `sections` is restated as `FormaBlock[]`. Zod infers the union member type
 * from the runtime schema array, which the discriminated-union assertion in
 * the registry widens; the registry's own distributive inference is the
 * accurate one.
 */
export type FormaSpec = Omit<z.infer<typeof FormaSpecSchema>, "sections"> & {
  sections: FormaBlock[];
};

export function parseFormaSpec(json: unknown): FormaSpec {
  return FormaSpecSchema.parse(json) as FormaSpec;
}

export function safeParseFormaSpec(json: unknown) {
  return FormaSpecSchema.safeParse(json);
}

export type { FormaBlock, FormaBlockType } from "../blocks/registry.js";
export type { FormaSource, Confidence } from "./source.js";
export { SourceSchema, ConfidenceSchema } from "./source.js";
export type { ArtifactKind, Purpose, Variant, ColorMode, Interaction } from "./artifact.js";
export {
  ArtifactSchema,
  PurposeSchema,
  VariantSchema,
  ColorModeSchema,
  InteractionSchema,
} from "./artifact.js";
