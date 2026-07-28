/**
 * Composition candidates and how one is chosen.
 *
 * A single render is one guess. When quality matters more than build time,
 * Forma renders several arrangements of the *same content* and picks the
 * one that scores best.
 *
 * Two constraints shape this. Candidates vary only along declared axes —
 * never by generating CSS — so every candidate is a document Forma would
 * have been willing to produce anyway. And selection is deterministic: the
 * same spec and the same seed must yield the same winner, or the artifact
 * stops being reproducible, which is the property the whole pipeline exists
 * to protect.
 */
import type { FormaSpec } from "../spec/schema.js";
import type { Density } from "../spec/artifact.js";

/** The axes a candidate may differ along. Nothing else varies. */
export interface CompositionCandidate {
  id: string;
  density: Density;
  /** Reading width for prose, as a token override. */
  measure: "narrow" | "default" | "wide";
  /** Where a breakout figure sits relative to the text that explains it. */
  figurePlacement: "after" | "before";
  /** Type scale multiplier for headings. */
  typeScale: "compact" | "default" | "generous";
}

const DENSITIES: Density[] = ["comfortable", "compact"];
const MEASURES: CompositionCandidate["measure"][] = ["narrow", "default", "wide"];
const PLACEMENTS: CompositionCandidate["figurePlacement"][] = ["after", "before"];
const SCALES: CompositionCandidate["typeScale"][] = ["compact", "default", "generous"];

/**
 * A small deterministic PRNG. `Math.random` is unavailable to the renderer
 * by design, and a seeded sequence is what makes "same spec, same seed,
 * same winner" true rather than aspirational.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derives a stable numeric seed from a string, so a spec id can seed a run. */
export function seedFrom(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function buildCandidates(spec: FormaSpec, count: number, seed: number): CompositionCandidate[] {
  const random = mulberry32(seed);
  const pick = <T>(options: readonly T[]): T =>
    options[Math.floor(random() * options.length)] as T;

  // The first candidate is always the spec exactly as authored. An author's
  // explicit choice should not have to win a tournament to survive.
  const base: CompositionCandidate = {
    id: "authored",
    density: spec.meta.density,
    measure: "default",
    figurePlacement: "after",
    typeScale: "default",
  };

  const seen = new Set<string>([key(base)]);
  const candidates = [base];
  // Bounded rather than while-true: with four axes the space is small, and
  // a loop that insists on `count` distinct entries would spin once it is
  // exhausted.
  for (let attempt = 0; attempt < count * 8 && candidates.length < count; attempt += 1) {
    const candidate: CompositionCandidate = {
      id: `c${candidates.length}`,
      density: pick(DENSITIES),
      measure: pick(MEASURES),
      figurePlacement: pick(PLACEMENTS),
      typeScale: pick(SCALES),
    };
    const k = key(candidate);
    if (seen.has(k)) continue;
    seen.add(k);
    candidates.push(candidate);
  }
  return candidates;
}

function key(candidate: CompositionCandidate): string {
  return [candidate.density, candidate.measure, candidate.figurePlacement, candidate.typeScale].join("|");
}

export interface CandidateScore {
  candidate: CompositionCandidate;
  /** Hard gate failures. Any one of these disqualifies the candidate outright. */
  disqualified: string[];
  /** Soft score out of 100. Only meaningful when `disqualified` is empty. */
  score: number;
  breakdown: Record<string, number>;
}

export interface CandidateEvidence {
  /** Findings from the static and DOM lints. */
  lintFindings: readonly { rule: string; message: string }[];
  /** Browser findings, when a browser pass ran. */
  axeViolations?: number;
  horizontalOverflow?: number;
  externalRequests?: number;
  brokenAnchors?: number;
}

const WEIGHTS = {
  informationHierarchy: 25,
  typography: 20,
  spacingRhythm: 15,
  contentDensity: 15,
  visualConsistency: 10,
  responsiveQuality: 10,
  distinctiveness: 5,
} as const;

/**
 * Hard gates are correctness, not taste. A candidate that fails one is not
 * a worse document, it is a broken one, so it is removed rather than
 * ranked below the others.
 */
function hardGate(evidence: CandidateEvidence): string[] {
  const failures: string[] = [];
  if ((evidence.externalRequests ?? 0) > 0) failures.push("made an external network request");
  if ((evidence.horizontalOverflow ?? 0) > 0) failures.push("overflows horizontally");
  if ((evidence.axeViolations ?? 0) > 0) failures.push("has accessibility violations");
  if ((evidence.brokenAnchors ?? 0) > 0) failures.push("has broken anchors");
  for (const finding of evidence.lintFindings) {
    if (finding.rule === "verified-claim-without-evidence") {
      failures.push("asserts a verified claim with no evidence");
    }
  }
  return failures;
}

/**
 * Soft scoring. Each dimension starts full and loses points for the
 * findings that bear on it, so a clean candidate scores 100 and the
 * deductions are traceable to a named rule rather than to a vibe.
 */
export function scoreCandidate(
  candidate: CompositionCandidate,
  evidence: CandidateEvidence,
): CandidateScore {
  const disqualified = hardGate(evidence);
  const breakdown: Record<string, number> = { ...WEIGHTS };

  const deduct = (dimension: keyof typeof WEIGHTS, amount: number) => {
    breakdown[dimension] = Math.max(0, (breakdown[dimension] ?? 0) - amount);
  };

  for (const finding of evidence.lintFindings) {
    switch (finding.rule) {
      case "card-saturation":
      case "nested-surface":
        deduct("informationHierarchy", 8);
        deduct("visualConsistency", 4);
        break;
      case "layout-repetition":
        deduct("visualConsistency", 5);
        deduct("distinctiveness", 3);
        break;
      case "pill-overuse":
      case "false-interactivity":
        deduct("visualConsistency", 4);
        break;
      case "prose-run":
      case "paragraph-density":
        deduct("contentDensity", 6);
        break;
      case "heading-overflow":
      case "orphan-heading":
        deduct("typography", 6);
        break;
      case "ch-measure":
      case "centered-width-cap":
        deduct("spacingRhythm", 6);
        break;
      default:
        deduct("visualConsistency", 2);
    }
  }

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return { candidate, disqualified, score, breakdown };
}

/**
 * Picks the winner. Ties break on the candidate's position in the generated
 * list, which is itself seeded — so a tie resolves the same way every run
 * instead of depending on sort stability.
 */
export function selectWinner(scores: readonly CandidateScore[]): CandidateScore | null {
  const eligible = scores.filter((entry) => entry.disqualified.length === 0);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, entry) => (entry.score > best.score ? entry : best));
}
