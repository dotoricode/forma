import type { FormaSpec } from "../spec/schema.js";

/** Minimal valid spec used by `forma init` and as a `generate` scaffold. */
export const STARTER_SPEC: FormaSpec = {
  version: "0.1",
  meta: {
    title: "Untitled Forma document",
    mode: "explain",
    audience: "engineering",
    language: "en",
    theme: "light",
    designSystem: "quiet-editorial",
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
