/**
 * Source and provenance primitives.
 *
 * Split out of `schema.ts` so block definitions can depend on them without
 * pulling in the whole spec (which itself depends on the block registry).
 */
import { z } from "zod";

export const SourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  path: z.string().optional(),
  kind: z.enum(["file", "diff", "junit", "note", "log", "url"]).optional(),
});
export type FormaSource = z.infer<typeof SourceSchema>;

export const ConfidenceSchema = z.enum(["verified", "inferred", "unknown"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

const SourceRefs = z.array(z.string()).default([]);

/** Shared fields every content block may carry: identity, provenance, confidence. */
export const BlockBase = z.object({
  id: z.string().min(1),
  sourceRefs: SourceRefs.optional(),
  confidence: ConfidenceSchema.optional(),
  notes: z.string().optional(),
});
