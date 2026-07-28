import { describe, expect, it } from "vitest";
import {
  buildCandidates,
  scoreCandidate,
  seedFrom,
  selectWinner,
  type CandidateEvidence,
} from "../../src/qa/candidates.js";
import { STARTER_SPEC } from "../../src/cli/starter-spec.js";

const clean: CandidateEvidence = {
  lintFindings: [],
  axeViolations: 0,
  horizontalOverflow: 0,
  externalRequests: 0,
  brokenAnchors: 0,
};

describe("candidate generation", () => {
  it("produces the same candidates for the same spec and seed", () => {
    // Reproducibility is the property the whole pipeline protects. A
    // tournament that picks differently on re-run silently breaks it.
    const a = buildCandidates(STARTER_SPEC, 8, seedFrom("forma"));
    const b = buildCandidates(STARTER_SPEC, 8, seedFrom("forma"));
    expect(a).toEqual(b);
  });

  it("produces different candidates for a different seed", () => {
    const a = buildCandidates(STARTER_SPEC, 8, seedFrom("one"));
    const b = buildCandidates(STARTER_SPEC, 8, seedFrom("two"));
    expect(a).not.toEqual(b);
  });

  it("always keeps the spec exactly as authored as the first candidate", () => {
    // An author's explicit choice should not have to win a tournament.
    const [first] = buildCandidates(STARTER_SPEC, 6, 1);
    expect(first?.id).toBe("authored");
    expect(first?.density).toBe(STARTER_SPEC.meta.density);
  });

  it("never returns duplicates, and terminates when the space is exhausted", () => {
    const candidates = buildCandidates(STARTER_SPEC, 500, 7);
    const keys = candidates.map((c) => [c.density, c.measure, c.figurePlacement, c.typeScale].join("|"));
    expect(new Set(keys).size).toBe(keys.length);
    // Four axes: 2 x 3 x 2 x 3 = 36 distinct arrangements.
    expect(candidates.length).toBeLessThanOrEqual(36);
  });
});

describe("hard gates", () => {
  it.each([
    ["externalRequests", { externalRequests: 1 }],
    ["horizontalOverflow", { horizontalOverflow: 1 }],
    ["axeViolations", { axeViolations: 1 }],
    ["brokenAnchors", { brokenAnchors: 1 }],
  ])("disqualifies a candidate for %s", (_name, overrides) => {
    const [candidate] = buildCandidates(STARTER_SPEC, 1, 1);
    const scored = scoreCandidate(candidate!, { ...clean, ...overrides });
    expect(scored.disqualified.length).toBeGreaterThan(0);
  });

  it("disqualifies a candidate that asserts a verified claim with no evidence", () => {
    const [candidate] = buildCandidates(STARTER_SPEC, 1, 1);
    const scored = scoreCandidate(candidate!, {
      ...clean,
      lintFindings: [{ rule: "verified-claim-without-evidence", message: "" }],
    });
    expect(scored.disqualified).toContain("asserts a verified claim with no evidence");
  });

  it("removes disqualified candidates from selection rather than ranking them low", () => {
    const candidates = buildCandidates(STARTER_SPEC, 3, 1);
    const scores = [
      scoreCandidate(candidates[0]!, { ...clean, axeViolations: 1 }),
      scoreCandidate(candidates[1]!, {
        ...clean,
        lintFindings: [{ rule: "card-saturation", message: "" }],
      }),
    ];
    const winner = selectWinner(scores);
    expect(winner?.candidate.id).toBe(candidates[1]?.id);
  });

  it("returns no winner when every candidate is disqualified", () => {
    const candidates = buildCandidates(STARTER_SPEC, 2, 1);
    const scores = candidates.map((c) => scoreCandidate(c, { ...clean, axeViolations: 1 }));
    expect(selectWinner(scores)).toBeNull();
  });
});

describe("soft scoring", () => {
  it("gives a clean candidate a full score", () => {
    const [candidate] = buildCandidates(STARTER_SPEC, 1, 1);
    expect(scoreCandidate(candidate!, clean).score).toBe(100);
  });

  it("traces every deduction to a named rule", () => {
    const [candidate] = buildCandidates(STARTER_SPEC, 1, 1);
    const scored = scoreCandidate(candidate!, {
      ...clean,
      lintFindings: [{ rule: "card-saturation", message: "" }],
    });
    expect(scored.score).toBeLessThan(100);
    expect(scored.breakdown["informationHierarchy"]).toBeLessThan(25);
  });

  it("never drives a dimension below zero", () => {
    const [candidate] = buildCandidates(STARTER_SPEC, 1, 1);
    const many = Array.from({ length: 20 }, () => ({ rule: "card-saturation", message: "" }));
    const scored = scoreCandidate(candidate!, { ...clean, lintFindings: many });
    expect(Math.min(...Object.values(scored.breakdown))).toBeGreaterThanOrEqual(0);
    expect(scored.score).toBeGreaterThanOrEqual(0);
  });

  it("picks the same winner every time for the same evidence", () => {
    const candidates = buildCandidates(STARTER_SPEC, 5, seedFrom("stable"));
    const evidence: CandidateEvidence[] = candidates.map((_, i) => ({
      ...clean,
      lintFindings: i === 2 ? [] : [{ rule: "layout-repetition", message: "" }],
    }));
    const run = () => selectWinner(candidates.map((c, i) => scoreCandidate(c, evidence[i]!)));
    expect(run()?.candidate.id).toBe(run()?.candidate.id);
    expect(run()?.candidate.id).toBe(candidates[2]?.id);
  });
});
