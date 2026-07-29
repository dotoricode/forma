import type { FormaBlock } from "../blocks/registry.js";
import type { Density } from "../spec/artifact.js";
import type { FormaSpec } from "../spec/schema.js";

export interface CompositionAxes {
  density: Density;
  measure: "narrow" | "default" | "wide";
  figurePlacement: "after" | "before";
  typeScale: "compact" | "default" | "generous";
}

/**
 * Applies a candidate without mutating the validated source. Density becomes
 * the candidate's spacing token; `before` moves each breakout immediately
 * ahead of the measured block it follows. The other axes are emitted as DOM
 * attributes and resolved by the stylesheet.
 */
export function applyComposition(spec: FormaSpec, axes: CompositionAxes): FormaSpec {
  const composed = structuredClone(spec);
  composed.meta.density = axes.density;
  if (axes.figurePlacement === "before") {
    composed.sections = placeBreakoutsBefore(composed.sections);
  }
  return composed;
}

function placeBreakoutsBefore(sections: FormaBlock[]): FormaBlock[] {
  const ordered = [...sections];
  for (let index = 1; index < ordered.length; index += 1) {
    const current = ordered[index]!;
    const previous = ordered[index - 1]!;
    if (current.type === "figure" && previous.type !== "cover") {
      ordered[index - 1] = current;
      ordered[index] = previous;
    }
  }
  return ordered;
}
