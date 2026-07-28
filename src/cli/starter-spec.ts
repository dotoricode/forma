import type { FormaSpec } from "../spec/schema.js";
import { writeFile } from "node:fs/promises";

/** Minimal valid spec used by `forma init` and as a `generate` scaffold. */
export const STARTER_SPEC: FormaSpec = {
  version: "0.1",
  meta: {
    title: "Untitled Forma document",
    mode: "explain",
    audience: "engineering",
    language: "en",
    theme: "light",
    designSystem: "simple",
    density: "comfortable",
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
      type: "prose",
      title: "Overview",
      body: "Replace this with the first section of your document.",
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
