/**
 * The block registry.
 *
 * Everything downstream is derived from `ALL_BLOCK_DEFINITIONS`: the Zod
 * discriminated union the spec validates against, the `FormaBlockType` union,
 * the exported JSON Schema, the per-artifact allowlist, and the render
 * dispatch. Registering one `defineBlock(...)` is the whole cost of adding a
 * block; nothing else has a list that can drift out of sync.
 */
import type { ReactElement } from "react";
import { z } from "zod";
import type { ArtifactKind } from "../spec/artifact.js";
import type { CompositionRoleName } from "../spec/roles.js";
import { codeBlocks } from "./code.js";
import { dataBlocks } from "./data.js";
import { decisionBlocks } from "./decision.js";
import { diagramBlocks } from "./diagram.js";
import { documentBlocks } from "./document.js";
import { manualBlocks } from "./manual.js";
import { reportBlocks } from "./report.js";
import type { BlockSchema, RenderContext } from "./types.js";

export const ALL_BLOCK_DEFINITIONS = [
  ...documentBlocks,
  ...codeBlocks,
  ...diagramBlocks,
  ...dataBlocks,
  ...decisionBlocks,
  ...reportBlocks,
  ...manualBlocks,
] as const;

export type AnyBlockDefinition = (typeof ALL_BLOCK_DEFINITIONS)[number];

/**
 * Distributes over the definition union so each block keeps its own payload
 * type. Matching on the `schema` field rather than on `BlockDefinition`'s
 * generics is deliberate: `TPrepared` appears in both `prepare`'s return and
 * the component's props, so it is invariant and no wildcard would match
 * every definition.
 */
type InferBlock<D> = D extends { schema: infer S extends BlockSchema } ? z.infer<S> : never;

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

/**
 * The table-of-contents label for a block, or undefined when it should not
 * appear. Falls back to a `title` field so most blocks need no hook.
 */
export function navTitleOf(block: FormaBlock, language: "ko" | "en"): string | undefined {
  const definition = byType.get(block.type);
  if (definition?.navTitle) {
    const custom = definition.navTitle as (
      b: FormaBlock,
      l: "ko" | "en",
    ) => string | undefined;
    return custom(block, language);
  }
  if ("title" in block && typeof block.title === "string") return block.title;
  return undefined;
}

/** Semantic roles a block type can satisfy in a composition contract. */
export function rolesForBlockType(type: string): readonly CompositionRoleName[] {
  return byType.get(type)?.roles ?? [];
}

/**
 * Async work every block needs before rendering, run once up front.
 *
 * Rendering is a synchronous React tree, so anything asynchronous —
 * Shiki highlighting, diff parsing — has to finish first. Blocks are
 * prepared concurrently because they are independent by construction.
 */
export async function prepareBlocks(
  blocks: readonly FormaBlock[],
  ctx: RenderContext,
): Promise<Map<string, unknown>> {
  const entries = await Promise.all(
    blocks.map(async (block) => {
      const definition = byType.get(block.type);
      if (!definition?.prepare) return [block.id, undefined] as const;
      const prepare = definition.prepare as (b: FormaBlock, c: RenderContext) => Promise<unknown>;
      return [block.id, await prepare(block, ctx)] as const;
    }),
  );
  return new Map(entries);
}

/**
 * Builds the React element for one validated block.
 *
 * The cast is the single place where the registry's per-definition typing is
 * traded for runtime dispatch. It is sound because the map key is the same
 * `type` literal the discriminated union parsed against, so the block handed
 * to a definition is always the one its schema produced, and the prepared
 * value is always the one its own `prepare` returned.
 */
export function renderBlockElement(
  block: FormaBlock,
  ctx: RenderContext,
  prepared: Map<string, unknown>,
): ReactElement {
  const definition = byType.get(block.type);
  if (!definition) {
    throw new Error(`forma: no block definition registered for type '${block.type}'`);
  }
  const Component = definition.Component as (props: {
    block: FormaBlock;
    ctx: RenderContext;
    prepared: unknown;
  }) => ReactElement;
  return Component({ block, ctx, prepared: prepared.get(block.id) });
}

export type { RenderContext } from "./types.js";
