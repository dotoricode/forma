/**
 * The block registry.
 *
 * Everything downstream is derived from `ALL_BLOCK_DEFINITIONS`: the Zod
 * discriminated union the spec validates against, the `FormaBlockType` union,
 * the exported JSON Schema, the per-artifact allowlist, and the render
 * dispatch. Registering one `defineBlock(...)` is the whole cost of adding a
 * block; nothing else has a list that can drift out of sync.
 */
import { z } from "zod";
import type { ArtifactKind } from "../spec/artifact.js";
import type { CompositionRoleName } from "../spec/roles.js";
import { codeBlocks } from "./code.js";
import { dataBlocks } from "./data.js";
import { decisionBlocks } from "./decision.js";
import { diagramBlocks } from "./diagram.js";
import { documentBlocks } from "./document.js";
import type { BlockDefinition, BlockSchema, RenderContext } from "./types.js";

export const ALL_BLOCK_DEFINITIONS = [
  ...documentBlocks,
  ...codeBlocks,
  ...diagramBlocks,
  ...dataBlocks,
  ...decisionBlocks,
] as const;

export type AnyBlockDefinition = (typeof ALL_BLOCK_DEFINITIONS)[number];

/** Distributes over the definition union so each block keeps its own payload type. */
type InferBlock<D> = D extends BlockDefinition<string, infer S extends BlockSchema>
  ? z.infer<S>
  : never;

export type FormaBlock = InferBlock<AnyBlockDefinition>;
export type FormaBlockType = AnyBlockDefinition["type"];

const schemas = ALL_BLOCK_DEFINITIONS.map((definition) => definition.schema);

/**
 * `discriminatedUnion` wants a tuple of at least two object schemas. The
 * registry array is built at module scope from `as const` tuples, so the
 * count is known to be well over two — but not to the type system, hence the
 * assertion. Everything the caller sees is typed through `FormaBlock`.
 */
export const BlockSchemaUnion = z.discriminatedUnion(
  "type",
  schemas as unknown as [BlockSchema, BlockSchema, ...BlockSchema[]],
);

const byType = new Map<string, AnyBlockDefinition>(
  ALL_BLOCK_DEFINITIONS.map((definition) => [definition.type, definition]),
);

export function getBlockDefinition(type: string): AnyBlockDefinition | undefined {
  return byType.get(type);
}

export function blockTypes(): FormaBlockType[] {
  return ALL_BLOCK_DEFINITIONS.map((d) => d.type);
}

/** Block types an artifact is allowed to use. */
export function blockTypesForArtifact(artifact: ArtifactKind): FormaBlockType[] {
  return ALL_BLOCK_DEFINITIONS.filter((d) => d.supportedArtifacts.includes(artifact)).map(
    (d) => d.type,
  );
}

/** Semantic roles a block type can satisfy in a composition contract. */
export function rolesForBlockType(type: string): readonly CompositionRoleName[] {
  return byType.get(type)?.roles ?? [];
}

/**
 * Renders one validated block.
 *
 * The cast is the single place where the registry's per-definition typing is
 * traded for runtime dispatch. It is sound because the map key is the same
 * `type` literal the discriminated union parsed against, so the block handed
 * to a definition is always the one its schema produced.
 */
export async function renderBlock(block: FormaBlock, ctx: RenderContext): Promise<string> {
  const definition = byType.get(block.type);
  if (!definition) {
    throw new Error(`forma: no block definition registered for type '${block.type}'`);
  }
  const render = definition.renderStatic as (b: FormaBlock, c: RenderContext) => string | Promise<string>;
  return render(block, ctx);
}

export type { RenderContext } from "./types.js";
