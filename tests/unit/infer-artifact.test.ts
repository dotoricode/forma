import { describe, expect, it } from "vitest";
import { inferArtifact, parseArtifact } from "../../src/spec/infer-artifact.js";
import { ARTIFACTS } from "../../src/spec/artifact.js";

describe("inferArtifact", () => {
  it.each([
    ["처음 쓰는 사람을 위한 설치 매뉴얼을 만들어줘", "manual"],
    ["OS별 통과율 지표를 대시보드로 보여줘", "dashboard"],
    ["이 PR diff를 코드 리뷰 자료로 정리해줘", "report"],
    ["JUnit 테스트 실패 결과를 보여줘", "report"],
    ["분기 현황을 경영진 보고서로 만들어줘", "report"],
    ["이 아키텍처가 어떻게 동작하는지 설명해줘", "report"],
    ["출시 여부를 팀이 함께 의사 결정할 자료를 만들어줘", "advanced"],
  ] as const)("%s -> %s", (instruction, expected) => {
    expect(inferArtifact(instruction).artifact).toBe(expected);
  });

  it("separates purpose from artifact for the two report flavours", () => {
    expect(inferArtifact("JUnit 테스트 실패 결과를 보여줘").purpose).toBe("diagnose");
    expect(inferArtifact("이 아키텍처가 어떻게 동작하는지 설명해줘").purpose).toBe("explain");
  });

  it("uses the input name as a secondary signal", () => {
    expect(inferArtifact("", "results.junit.xml")).toEqual({
      artifact: "report",
      purpose: "diagnose",
    });
  });

  it("falls back to an explanatory report when no intent signal exists", () => {
    expect(inferArtifact("정리해줘", "notes.txt")).toEqual({
      artifact: "report",
      purpose: "explain",
    });
  });
});

describe("parseArtifact", () => {
  it("accepts every public artifact", () => {
    for (const artifact of ARTIFACTS) {
      expect(parseArtifact(artifact)).toBe(artifact);
    }
  });

  it("rejects a value that is no longer an artifact", () => {
    // `workspace` was a 0.1 designSystem, not an artifact. Accepting it here
    // would let a stale CLI invocation silently pick the wrong contract.
    expect(parseArtifact("workspace")).toBeNull();
    expect(parseArtifact("explain")).toBeNull();
  });
});
