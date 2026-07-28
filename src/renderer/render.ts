import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateFormaSpec, formatValidationIssues } from "../spec/validate.js";
import { renderSpecToHtml } from "./shell.js";
import { redactSecrets, stripHomeDirectory } from "../security/sanitize.js";
import { FORMA_SPEC_VERSION } from "../spec/schema.js";

export class FormaSpecError extends Error {}

export interface RenderOutcome {
  outDir: string;
  htmlPath: string;
  manifestPath: string;
  bytes: number;
}

/** Reads and validates a `forma.spec.json` file, throwing FormaSpecError on failure. */
export async function loadSpecFile(specPath: string) {
  const raw = await readFile(specPath, "utf-8");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new FormaSpecError(`forma: could not parse ${specPath} as JSON — ${(error as Error).message}`);
  }
  const result = validateFormaSpec(json);
  if (!result.ok) {
    throw new FormaSpecError(
      `forma: spec validation failed for ${specPath}\n${formatValidationIssues(result.issues)}`,
    );
  }
  return result.spec;
}

/** Renders a validated spec file to a self-contained `index.html` plus manifest. */
export async function renderSpecFileToDir(specPath: string, outDir: string): Promise<RenderOutcome> {
  const spec = await loadSpecFile(specPath);
  const { html } = await renderSpecToHtml(spec);

  const guarded = stripHomeDirectory(redactSecrets(html).text);

  await mkdir(outDir, { recursive: true });
  await mkdir(path.join(outDir, "qa"), { recursive: true });

  const htmlPath = path.join(outDir, "index.html");
  await writeFile(htmlPath, guarded, "utf-8");

  const specOutPath = path.join(outDir, "forma.spec.json");
  await writeFile(specOutPath, JSON.stringify(spec, null, 2), "utf-8");

  const manifest = {
    generator: "forma@0.1.0",
    specVersion: FORMA_SPEC_VERSION,
    artifact: spec.meta.artifact,
    purpose: spec.meta.purpose,
    variant: spec.meta.variant ?? null,
    interaction: spec.meta.interaction,
    title: spec.meta.title,
    language: spec.meta.language,
    sectionCount: spec.sections.length,
    bytes: Buffer.byteLength(guarded, "utf-8"),
  };
  const manifestPath = path.join(outDir, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  return { outDir, htmlPath, manifestPath, bytes: manifest.bytes };
}
