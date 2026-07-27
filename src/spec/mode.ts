import { ModeSchema, type FormaMode } from "./schema.js";

interface ModeSignal {
  mode: FormaMode;
  patterns: RegExp[];
}

const MODE_SIGNALS: ModeSignal[] = [
  {
    mode: "manual",
    patterns: [
      /\bmanual\b/i,
      /\bhow[- ]?to\b/i,
      /\btutorial\b/i,
      /\bonboard/i,
      /\bsetup\b/i,
      /\binstall/i,
      /매뉴얼|사용법|가이드|절차|설치|초기\s*설정|온보딩/,
    ],
  },
  {
    mode: "review",
    patterns: [
      /\breview\b/i,
      /\bpull request\b/i,
      /\bpr\b/i,
      /\bdiff\b/i,
      /리뷰|코드\s*검토|변경\s*검토|풀\s*리퀘스트/,
    ],
  },
  {
    mode: "test",
    patterns: [
      /\btest(?:s|ing)?\b/i,
      /\bjunit\b/i,
      /\bcoverage\b/i,
      /\bqa\b/i,
      /테스트|시험\s*결과|검증\s*결과|실패\s*분석/,
    ],
  },
  {
    mode: "report",
    patterns: [
      /\breport\b/i,
      /\bstatus\b/i,
      /\bstakeholder\b/i,
      /\bexecutive\b/i,
      /\bresearch\b/i,
      /\banalysis\b/i,
      /보고|현황|리서치|조사|분석|이해관계자/,
    ],
  },
  {
    mode: "explain",
    patterns: [
      /\bexplain\b/i,
      /\barchitecture\b/i,
      /\boverview\b/i,
      /\bunderstand\b/i,
      /설명|이해|구조|원리|개요/,
    ],
  },
];

/**
 * Selects a document mode from the user's task instruction and input name.
 * This is intentionally deterministic: it does not inspect or transmit the
 * source material and provides a stable fallback for CLI scaffolding.
 */
export function inferFormaMode(instruction: string, input = ""): FormaMode {
  const haystack = `${instruction}\n${input}`;
  const scored = MODE_SIGNALS.map((signal, index) => ({
    mode: signal.mode,
    score: signal.patterns.reduce(
      (sum, pattern) => sum + (pattern.test(haystack) ? 1 : 0),
      0,
    ),
    index,
  })).sort((left, right) => right.score - left.score || left.index - right.index);

  return scored[0]?.score ? scored[0].mode : "explain";
}

export function parseFormaMode(value: string): FormaMode | null {
  const result = ModeSchema.safeParse(value);
  return result.success ? result.data : null;
}
