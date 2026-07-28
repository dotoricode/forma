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
  it("carries the report vocabulary", () => {
    for (const type of [
      "thesis",
      "executive-summary",
      "headline-finding",
      "evidence-stack",
      "option-comparison",
      "decision-matrix",
      "recommendation",
      "implication",
      "risk-register",
      "action-plan",
      "pull-quote",
      "figure",
      "appendix",
      "source-ledger",
    ]) {
      expect(getBlockDefinition(type), `${type} must be registered`).toBeDefined();
    }
  });

  it("carries the manual vocabulary", () => {
    for (const type of [
      "task-map",
      "audience-scope",
      "prerequisite",
      "environment-selector",
      "quick-path",
      "step",
      "checkpoint",
      "decision-tree",
      "troubleshooting",
      "compatibility-matrix",
      "version-note",
      "completion-check",
      "next-task",
    ]) {
      expect(getBlockDefinition(type), `${type} must be registered`).toBeDefined();
    }
  });

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
    case "thesis":
      return { ...base, statement: "s" };
    case "executive-summary":
      return { ...base, body: "b" };
    case "headline-finding":
      return { ...base, claim: "c", detail: "d" };
    case "evidence-stack":
      return { ...base, items: [{ summary: "s" }] };
    case "option-comparison":
      return {
        ...base,
        criteria: ["cost"],
        options: [
          { id: "a", label: "A", cells: { cost: "low" } },
          { id: "b", label: "B", cells: { cost: "high" } },
        ],
      };
    case "decision-matrix":
      return {
        ...base,
        criteria: [{ id: "c1", label: "Cost", weight: 1 }],
        options: [
          { id: "a", label: "A", scores: { c1: 3 } },
          { id: "b", label: "B", scores: { c1: 2 } },
        ],
      };
    case "recommendation":
      return { ...base, statement: "s", rationale: "r" };
    case "implication":
      return { ...base, entries: [{ audience: "QA", effect: "e" }] };
    case "risk-register":
      return {
        ...base,
        risks: [
          { id: "r1", description: "d", likelihood: "low", impact: "high", mitigation: "m" },
        ],
      };
    case "action-plan":
      return { ...base, items: [{ id: "a1", label: "l", owner: "o" }] };
    case "pull-quote":
      return { ...base, quote: "q" };
    case "figure":
      return { ...base, caption: "c" };
    case "appendix":
      return { ...base, title: "t", body: "b" };
    case "source-ledger":
      return base;
    case "task-map":
      return { ...base, outcomes: ["o"] };
    case "audience-scope":
      return { ...base, appliesTo: ["a"] };
    case "prerequisite":
      return { ...base, items: [{ label: "l" }] };
    case "environment-selector":
      return {
        ...base,
        label: "OS",
        options: [
          { id: "mac", label: "macOS" },
          { id: "win", label: "Windows" },
        ],
      };
    case "quick-path":
      return { ...base, steps: ["s"] };
    case "step":
      return { ...base, number: 1, title: "t", instruction: "i" };
    case "checkpoint":
      return { ...base, conditions: ["c"] };
    case "decision-tree":
      return {
        ...base,
        question: "q",
        branches: [
          { condition: "a", action: "x" },
          { condition: "b", action: "y" },
        ],
      };
    case "troubleshooting":
      return { ...base, entries: [{ symptom: "s", fix: "f" }] };
    case "compatibility-matrix":
      return {
        ...base,
        columns: ["v1"],
        rows: [{ id: "r", label: "l", cells: { v1: "supported" } }],
      };
    case "version-note":
      return { ...base, appliesFrom: "1.0", note: "n" };
    case "completion-check":
      return { ...base, check: "c", expected: "e" };
    case "next-task":
      return { ...base, tasks: [{ label: "l" }] };
    default:
      throw new Error(
        `block '${type}' was registered without a minimal fixture — add one so the registry tests cover it`,
      );
  }
}
