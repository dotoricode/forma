/**
 * Artifact inference for CLI scaffolding.
 *
 * Replaces the 0.1 `mode` inference. Under 0.2 the skill is expected to fix
 * the artifact at invocation time (`/forma:report` means artifact=report),
 * so this only serves `forma generate`, where a human typed a free-form
 * instruction and no artifact was named.
 *
 * Deterministic on purpose: it reads the instruction string and the input
 * filename only. It never inspects or transmits the source material.
 */
import { ArtifactSchema, type ArtifactKind, type Purpose } from "./artifact.js";

interface ArtifactSignal {
  artifact: ArtifactKind;
  purpose: Purpose;
  patterns: RegExp[];
}

const ARTIFACT_SIGNALS: ArtifactSignal[] = [
  {
    artifact: "manual",
    purpose: "operate",
    patterns: [
      /\bmanual\b/i,
      /\bhow[- ]?to\b/i,
      /\btutorial\b/i,
      /\bonboard/i,
      /\bsetup\b/i,
      /\binstall/i,
      /\brunbook\b/i,
      /매뉴얼|사용법|가이드|절차|설치|초기\s*설정|온보딩/,
    ],
  },
  {
    artifact: "dashboard",
    purpose: "monitor",
    patterns: [
      /\bdashboard\b/i,
      /\bkpi\b/i,
      /\bmetric/i,
      /\bmonitor/i,
      /\btrend\b/i,
      /대시보드|지표|모니터링|추이|현황판/,
    ],
  },
  {
    artifact: "advanced",
    purpose: "decide",
    patterns: [
      /\bdecision room\b/i,
      /\bgo[/ -]?no[- ]?go\b/i,
      /\bsimulat/i,
      /\bworkshop\b/i,
      /의사\s*결정|회의\s*자료|시뮬레이션|합의/,
    ],
  },
  {
    artifact: "report",
    purpose: "diagnose",
    patterns: [
      /\btest(?:s|ing)?\b/i,
      /\bjunit\b/i,
      /\bcoverage\b/i,
      /\bqa\b/i,
      /테스트|시험\s*결과|검증\s*결과|실패\s*분석/,
    ],
  },
  {
    artifact: "report",
    purpose: "decide",
    patterns: [
      /\breview\b/i,
      /\bpull request\b/i,
      /\bdiff\b/i,
      /\breport\b/i,
      /\bstakeholder\b/i,
      /\bexecutive\b/i,
      /\bpostmortem\b/i,
      /리뷰|코드\s*검토|변경\s*검토|보고|현황|회고/,
    ],
  },
  {
    artifact: "report",
    purpose: "explain",
    patterns: [
      /\bexplain\b/i,
      /\barchitecture\b/i,
      /\boverview\b/i,
      /\bunderstand\b/i,
      /설명|이해|구조|원리|개요/,
    ],
  },
];

export interface InferredArtifact {
  artifact: ArtifactKind;
  purpose: Purpose;
}

/** Picks an artifact and purpose from a task instruction and input name. */
export function inferArtifact(instruction: string, input = ""): InferredArtifact {
  const haystack = `${instruction}\n${input}`;
  const scored = ARTIFACT_SIGNALS.map((signal, index) => ({
    signal,
    score: signal.patterns.reduce((sum, pattern) => sum + (pattern.test(haystack) ? 1 : 0), 0),
    index,
  })).sort((left, right) => right.score - left.score || left.index - right.index);

  const best = scored[0];
  if (!best || best.score === 0) return { artifact: "report", purpose: "explain" };
  return { artifact: best.signal.artifact, purpose: best.signal.purpose };
}

export function parseArtifact(value: string): ArtifactKind | null {
  const result = ArtifactSchema.safeParse(value);
  return result.success ? result.data : null;
}
