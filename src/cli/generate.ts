import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FormaMode, FormaSource, FormaSpec } from "../spec/schema.js";
import { STARTER_SPEC } from "./starter-spec.js";

function sourceKind(input: string): FormaSource["kind"] {
  const extension = path.extname(input).toLowerCase();
  if (extension === ".diff" || extension === ".patch") return "diff";
  if (extension === ".xml" && /junit|test|result/i.test(path.basename(input))) return "junit";
  if (extension === ".log") return "log";
  return "file";
}

export async function writeGeneratedSpec(options: {
  input: string;
  mode: FormaMode;
  out: string;
}): Promise<FormaSpec> {
  const inputPath = path.resolve(options.input);
  await stat(inputPath).catch(() => {
    throw new Error(`input does not exist: ${options.input}`);
  });

  const inputLabel = path.basename(inputPath);
  const spec: FormaSpec = {
    ...STARTER_SPEC,
    meta: {
      ...STARTER_SPEC.meta,
      title: `Forma: ${inputLabel}`,
      mode: options.mode,
    },
    sources: [
      {
        id: "input",
        label: inputLabel,
        path: options.input,
        kind: sourceKind(options.input),
      },
    ],
    narrative: {
      ...STARTER_SPEC.narrative,
      question: `What should the reader learn or decide from ${inputLabel}?`,
    },
    sections: STARTER_SPEC.sections.map((section) =>
      section.type === "cover"
        ? { ...section, title: `Forma: ${inputLabel}` }
        : section,
    ),
  };

  const outPath = path.resolve(options.out);
  await mkdir(path.dirname(outPath), { recursive: true });
  try {
    await writeFile(outPath, JSON.stringify(spec, null, 2), {
      encoding: "utf-8",
      flag: "wx",
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(
        `output already exists: ${options.out}. Choose a new path with --out or remove it intentionally.`,
      );
    }
    throw error;
  }
  return spec;
}
