import { describe, expect, it } from "vitest";
import { inferFormaMode, parseFormaMode } from "../../src/spec/mode.js";

describe("inferFormaMode", () => {
  it.each([
    ["처음 쓰는 사람을 위한 설치 매뉴얼을 만들어줘", "manual"],
    ["이 PR diff를 코드 리뷰 자료로 정리해줘", "review"],
    ["JUnit 테스트 실패 결과를 보여줘", "test"],
    ["분기 현황을 경영진 보고서로 만들어줘", "report"],
    ["이 아키텍처가 어떻게 동작하는지 설명해줘", "explain"],
  ] as const)("%s -> %s", (instruction, expected) => {
    expect(inferFormaMode(instruction)).toBe(expected);
  });

  it("uses the input name as a secondary signal", () => {
    expect(inferFormaMode("", "results.junit.xml")).toBe("test");
  });

  it("falls back to explain when no intent signal exists", () => {
    expect(inferFormaMode("정리해줘", "notes.txt")).toBe("explain");
  });
});

describe("parseFormaMode", () => {
  it("accepts all public modes", () => {
    for (const mode of ["explain", "review", "test", "report", "manual"]) {
      expect(parseFormaMode(mode)).toBe(mode);
    }
  });

  it("rejects unknown modes", () => {
    expect(parseFormaMode("dashboard")).toBeNull();
  });
});
