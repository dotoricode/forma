/**
 * Block definition contract.
 *
 * A block used to be spread across five places: a Zod schema in
 * `spec/schema.ts`, a member of the discriminated union, a `case` in the
 * renderer's switch, an entry in whatever artifact was allowed to use it,
 * and a line in the docs. Adding one meant editing all five and forgetting
 * any of them failed silently or at runtime.
 *
 * A `BlockDefinition` is the single place a block is described. The registry
 * derives the union, the type name, the JSON Schema, the artifact allowlist,
 * and the render dispatch from it.
 */
import type { z } from "zod";
import type { ArtifactKind } from "../spec/artifact.js";
import type { CompositionRoleName } from "../spec/roles.js";
import type { FormaSource } from "../spec/source.js";

/** Which family of visual grammar the block belongs to. Drives grouping, not styling. */
export type BlockCategory =
  | "document"
  | "code"
  | "diagram"
  | "data"
  | "decision"
  | "dashboard"
  | "manual"
  | "advanced";

/**
 * What a block needs from the page, declared rather than inferred from its
 * CSS class. `breakout` blocks are allowed past the reading measure;
 * `interactive` blocks require an island and must degrade without JS.
 */
export type BlockCapability =
  | "measure"
  | "breakout"
  | "numeric"
  | "svg"
  | "interactive"
  | "print-unsafe";

export interface RenderContext {
  sourcesById: Map<string, FormaSource>;
  language: "ko" | "en";
}

export type StaticBlockRenderer<T> = (block: T, ctx: RenderContext) => string | Promise<string>;

/**
 * A block schema must be an object carrying a `type` literal so the registry
 * can build a discriminated union from the collected definitions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockSchema = z.ZodObject<any>;

export interface BlockDefinition<TType extends string = string, TSchema extends BlockSchema = BlockSchema> {
  /** Discriminator value. Must match the `type` literal inside `schema`. */
  readonly type: TType;
  readonly category: BlockCategory;
  readonly schema: TSchema;
  readonly renderStatic: StaticBlockRenderer<z.infer<TSchema>>;
  readonly capabilities: readonly BlockCapability[];
  /** Artifacts allowed to use this block. An empty list would make it unusable. */
  readonly supportedArtifacts: readonly ArtifactKind[];
  /**
   * Semantic roles this block can fill in an artifact's composition contract.
   * A block with no roles is decorative-by-omission and can never satisfy a
   * required slot — that is a legitimate choice for things like `source-note`.
   */
  readonly roles?: readonly CompositionRoleName[];
}

/**
 * Declares a block definition while keeping its literal `type` and concrete
 * schema type. Without this helper the registry array widens to
 * `BlockDefinition<string, ZodObject>` and every render callback loses its
 * argument type.
 */
export function defineBlock<TType extends string, TSchema extends BlockSchema>(
  definition: BlockDefinition<TType, TSchema>,
): BlockDefinition<TType, TSchema> {
  return definition;
}
