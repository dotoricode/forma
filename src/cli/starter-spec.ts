import type { FormaSpec } from "../spec/schema.js";
import { writeFile } from "node:fs/promises";

/**
 * Minimal valid spec used by `forma init` and as a `generate` scaffold.
 *
 * It is deliberately a *complete* report rather than the two-block sketch it
 * used to be. Under 0.2 the report contract requires a finding, a
 * recommendation, an action, and provenance, so a two-block starter would
 * fail the moment it was validated. Shipping the full skeleton also teaches
 * the shape: each placeholder names the slot it occupies.
 */
export const STARTER_SPEC: FormaSpec = {
  version: "0.2",
  meta: {
    title: "Untitled Forma document",
    artifact: "report",
    purpose: "explain",
    audience: "engineering",
    language: "en",
    variant: "technical",
    colorMode: "light",
    density: "comfortable",
    interaction: "static",
    confidentiality: "internal",
  },
  sources: [],
  narrative: {
    question: "What question does this document answer?",
    summary: "One or two sentences summarizing the answer.",
    takeaways: [],
  },
  sections: [
    {
      id: "cover",
      type: "cover",
      title: "Untitled Forma document",
      meta: [],
    },
    {
      id: "overview",
      type: "summary",
      title: "Overview",
      body: "Replace this with the short version for a reader who stops here.",
    },
    {
      id: "finding",
      type: "finding",
      title: "Replace this with what you found",
      body: "State the finding as a claim, then explain what supports it.",
      severity: "info",
    },
    {
      id: "recommendation",
      type: "decision",
      title: "Replace this with what you recommend",
      status: "proposed",
      rationale: "Explain why this is the recommended course.",
    },
    {
      id: "actions",
      type: "actions",
      title: "Next steps",
      items: [{ label: "Replace this with the first concrete action" }],
    },
    {
      id: "sources",
      type: "source-note",
      title: "Sources",
    },
  ],
};

export async function writeStarterSpecFile(out: string): Promise<void> {
  try {
    await writeFile(out, JSON.stringify(STARTER_SPEC, null, 2), {
      encoding: "utf-8",
      flag: "wx",
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(
        `output already exists: ${out}. Choose a new path with --out or remove it intentionally.`,
      );
    }
    throw error;
  }
}
