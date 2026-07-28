import { describe, expect, it } from "vitest";
import {
  ALL_BLOCK_DEFINITIONS,
  BlockSchemaUnion,
  blockTypes,
  blockTypesForArtifact,
  getBlockDefinition,
  rolesForBlockType,
} from "../../src/blocks/registry.js";
import { ARTIFACTS } from "../../src/spec/artifact.js";
import { COMPOSITION_ROLES } from "../../src/spec/roles.js";

/**
 * These guard the registry's whole reason for existing: that one
 * registration is enough, and that nothing downstream keeps a parallel list
 * that can drift out of sync with it.
 */
describe("block registry", () => {
  it("still carries every block the 0.1 spec could use", () => {
    const legacyTwenty = [
      "cover",
      "summary",
      "prose",
      "key-points",
      "annotated-code",
      "diff",
      "flow",
      "sequence",
      "timeline",
      "comparison",
      "architecture",
      "test-summary",
      "test-matrix",
      "chart",
      "finding",
      "risk",
      "decision",
      "actions",
      "glossary",
      "source-note",
    ];
    for (const type of legacyTwenty) {
      expect(getBlockDefinition(type), `${type} must stay registered`).toBeDefined();
    }
  });

  it("derives the validation union from the registered definitions", () => {
    // Not a restatement of the array: this proves the union the spec parses
    // against is generated, so a registered block cannot be unparseable.
    for (const definition of ALL_BLOCK_DEFINITIONS) {
      const parsed = BlockSchemaUnion.safeParse(minimalBlockFor(definition.type));
      expect(parsed.success, `${definition.type} should parse through the union`).toBe(true);
    }
  });

  it("has no duplicate type discriminators", () => {
    const types = blockTypes();
    expect(new Set(types).size).toBe(types.length);
  });

  it("gives every definition at least one artifact that can use it", () => {
    for (const definition of ALL_BLOCK_DEFINITIONS) {
      expect(definition.supportedArtifacts.length, `${definition.type} is unusable`).toBeGreaterThan(0);
    }
  });

  it("only declares roles that exist in the role vocabulary", () => {
    for (const definition of ALL_BLOCK_DEFINITIONS) {
      for (const role of definition.roles ?? []) {
        expect(COMPOSITION_ROLES, `${definition.type} declares unknown role '${role}'`).toContain(role);
      }
    }
  });

  it("declares a schema whose type literal matches its discriminator", () => {
    for (const definition of ALL_BLOCK_DEFINITIONS) {
      const parsed = definition.schema.safeParse(minimalBlockFor(definition.type));
      expect(parsed.success, `${definition.type} schema rejects its own type literal`).toBe(true);
    }
  });

  it("resolves an artifact's allowlist from the definitions", () => {
    for (const artifact of ARTIFACTS) {
      const allowed = blockTypesForArtifact(artifact);
      expect(allowed.length).toBeGreaterThan(0);
      for (const type of allowed) {
        expect(getBlockDefinition(type)?.supportedArtifacts).toContain(artifact);
      }
    }
  });

  it("returns no roles for an unregistered type instead of throwing", () => {
    expect(rolesForBlockType("not-a-block")).toEqual([]);
  });
});

/** Smallest payload that satisfies each registered block's schema. */
function minimalBlockFor(type: string): Record<string, unknown> {
  const base = { id: `${type}-1`, type };
  switch (type) {
    case "cover":
      return { ...base, title: "t" };
    case "summary":
      return { ...base, title: "t", body: "b" };
    case "prose":
      return { ...base, body: "b" };
    case "key-points":
      return { ...base, points: ["p"] };
    case "annotated-code":
      return { ...base, language: "ts", code: "const a = 1;" };
    case "diff":
      return { ...base, unifiedDiff: "@@ -1 +1 @@\n-a\n+b\n" };
    case "flow":
      return { ...base, nodes: [{ id: "n", label: "l" }] };
    case "sequence":
      return { ...base, participants: [{ id: "p", label: "l" }] };
    case "timeline":
      return { ...base, entries: [{ id: "e", when: "now", label: "l" }] };
    case "comparison":
      return { ...base, left: { label: "l" }, right: { label: "r" } };
    case "architecture":
      return { ...base, nodes: [{ id: "n", label: "l" }] };
    case "test-summary":
      return { ...base, total: 1, passed: 1, failed: 0 };
    case "test-matrix":
      return { ...base, columns: ["c"], rows: [{ id: "r", label: "l", cells: { c: "pass" } }] };
    case "chart":
      return { ...base, categories: ["c"], series: [{ label: "s", values: [1] }] };
    case "finding":
      return { ...base, title: "t", body: "b" };
    case "risk":
      return { ...base, title: "t", likelihood: "low", impact: "low", mitigation: "m" };
    case "decision":
      return { ...base, title: "t", status: "proposed", rationale: "r" };
    case "actions":
      return { ...base, items: [{ label: "l" }] };
    case "glossary":
      return { ...base, terms: [{ term: "t", definition: "d" }] };
    case "source-note":
      return base;
    default:
      throw new Error(
        `block '${type}' was registered without a minimal fixture — add one so the registry tests cover it`,
      );
  }
}
